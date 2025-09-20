import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Home,
  FileText,
  Layers,
  Settings,
  Sun,
  Moon,
  Send,
  ExternalLink,
  Users,
  BarChart3,
  //Hash,
  //Calendar,
} from "lucide-react";
import axios from "axios";
import "./App.css";

const FB_SDK_POLL_INTERVAL = 300; // ms
const FB_SDK_POLL_ATTEMPTS = 30; // total wait ~9s

const App = () => {
  const [mentions, setMentions] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("mentions");
  const [darkMode, setDarkMode] = useState(false);
  const [fbReady, setFbReady] = useState(false);
  const [fbStatus, setFbStatus] = useState(null);
  const fbPollRef = useRef(0);

  // Theme init - read from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDarkMode(true);
    else setDarkMode(false);
  }, []);

  // Persist theme
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Build FB SDK loader and login status checks
  useEffect(() => {
    // Avoid loading multiple times
    if (window.FB) {
      setFbReady(true);
      // get status
      window.FB.getLoginStatus((resp) => {
        setFbStatus(resp?.status ?? "unknown");
      });
      return;
    }

    // Insert SDK script
    window.fbAsyncInit = function () {
      try {
        window.FB.init({
          appId: process.env.REACT_APP_FB_APP_ID || "", // set in .env
          cookie: true,
          xfbml: false,
          version: "v23.0",
        });
        setFbReady(true);
        window.FB.getLoginStatus((resp) => {
          setFbStatus(resp?.status ?? "unknown");
        });
        console.info("FB SDK initialized");
      } catch (err) {
        console.error("FB init error:", err);
        setFbReady(false);
      }
    };

    (function (d, s, id) {
      let js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");

    // Poll to see if window.FB is ready (safe fallback if fbAsyncInit not called quickly)
    fbPollRef.current = 0;
    const poll = setInterval(() => {
      fbPollRef.current += 1;
      if (window.FB) {
        setFbReady(true);
        window.FB.getLoginStatus((resp) => setFbStatus(resp?.status ?? "unknown"));
        clearInterval(poll);
      } else if (fbPollRef.current > FB_SDK_POLL_ATTEMPTS) {
        // stop trying
        clearInterval(poll);
        setFbReady(false);
        console.warn("FB SDK not available. Make sure JSSDK option is enabled and appId is correct.");
      }
    }, FB_SDK_POLL_INTERVAL);

    return () => clearInterval(poll);
  }, []);

  // Toggle theme helper
  const toggleTheme = () => setDarkMode((p) => !p);

  // Helper: clear selected message when switching away from mentions
  useEffect(() => {
    if (activeTab !== "mentions") {
      setSelectedMessage(null);
    }
  }, [activeTab]);

  // ---------------- Fetching functions ----------------
  const fetchMentions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/instagram/mentions");
      const rawData = res.data?.data || [];

      const mentionsFormatted = rawData.map((item, i) => ({
        platform: "Instagram",
        id: item.id || i,
        message: item.text || item.caption || "",
        content: item.caption || "",
        time: item.timestamp || new Date().toISOString(),
        mediaId: item.media_id || "",
        username: item.username || "Unknown",
        mediaUrl: item.media_url || "",
        permalink: item.permalink || "",
      }));

      setMentions(mentionsFormatted);
    } catch (err) {
      console.error("Fetch Mentions error:", err);
      alert("❌ Failed to fetch mentions. Check backend or network.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/instagram/posts");
      const rawData = res.data?.data || [];

      const postsFormatted = rawData.map((p, i) => ({
        id: p.id || i,
        caption: p.caption || "No caption",
        mediaUrl: p.media_url || "",
        permalink: p.permalink || "",
        timestamp: p.timestamp || new Date().toISOString(),
      }));

      setPosts(postsFormatted);
    } catch (err) {
      console.error("Fetch Posts error:", err);
      alert("❌ Failed to fetch posts. Check backend or network.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Reply to mention ----------------
  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    try {
      const form = new FormData();
      form.append("media_id", selectedMessage.mediaId);
      form.append("comment_text", replyText.trim());

      await axios.post("http://localhost:8000/instagram/reply-to-mentions", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Reply sent");
      setReplyText("");
    } catch (err) {
      console.error("Reply error:", err);
      alert("❌ Failed to send reply.");
    }
  };

  // ---------------- Facebook login helpers ----------------
  const handleFBLogin = (options = {}) => {
    if (!fbReady || !window.FB) {
      alert("Facebook SDK not ready. Make sure the SDK is loaded and JSSDK option enabled in your FB app settings.");
      return;
    }

    // call FB.login and ask for business scopes
    window.FB.login(
      (response) => {
        console.log("FB login response", response);
        setFbStatus(response?.status ?? "unknown");
        if (response.status === "connected") {
          alert("✅ Logged in to Facebook (connected). You can now fetch pages/tokens.");
          // you may want to send response.authResponse.accessToken to backend
        } else if (response.status === "not_authorized") {
          alert("⚠️ Not authorized. Grant required permissions and try again.");
        } else {
          // unknown or other states
          alert("⚠️ Login not completed. Check console for details.");
        }
      },
      {
        scope: "ads_read,ads_management,pages_read_engagement,pages_show_list,instagram_basic",
        return_scopes: true,
        auth_type: "rerequest",
        ...options,
      }
    );
  };

  // small helper to explain FB status to user
  const fbStatusMessage = () => {
    if (!fbReady) return "Facebook SDK not ready. Check appId and JSSDK setting.";
    if (fbStatus === "connected") return "Facebook: connected";
    if (fbStatus === "not_authorized") return "Facebook: logged in but not authorized";
    if (fbStatus === "unknown" || fbStatus == null) return "Facebook: not logged in / unknown";
    return `Facebook: ${fbStatus}`;
  };

  // ---------------- Render ----------------
  return (
    <div className={`app-root ${darkMode ? "dark" : "light"}`} style={{ height: "100vh", display: "flex" }}>
      {/* Left Sidebar */}
      <aside className="nav-sidebar">
        <div className="nav-icon logo">
          <img src="/logo.png" alt="logo" style={{ width: 28, height: 28 }} />
        </div>

        <button className={`nav-icon ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")} title="Home">
          <Home style={{ width: 22, height: 22 }} />
        </button>

        <button className={`nav-icon ${activeTab === "mentions" ? "active" : ""}`} onClick={() => setActiveTab("mentions")} title="Mentions">
          <MessageSquare style={{ width: 22, height: 22 }} />
        </button>

        <button className={`nav-icon ${activeTab === "posts" ? "active" : ""}`} onClick={() => setActiveTab("posts")} title="Posts">
          <Layers style={{ width: 22, height: 22 }} />
        </button>

        <button className={`nav-icon ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")} title="Analytics">
          <BarChart3 style={{ width: 22, height: 22 }} />
        </button>

        <button className={`nav-icon ${activeTab === "reports" ? "active" : ""}`} onClick={() => setActiveTab("reports")} title="Reports">
          <FileText style={{ width: 22, height: 22 }} />
        </button>

        <button className={`nav-icon ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")} title="Settings">
          <Settings style={{ width: 22, height: 22 }} />
        </button>

        {/* theme toggle at bottom */}
        <div style={{ marginTop: "auto", paddingBottom: 12 }}>
          <button className="theme-toggle" onClick={() => toggleTheme()} title="Toggle theme">
            {darkMode ? <Sun style={{ width: 18, height: 18 }} /> : <Moon style={{ width: 18, height: 18 }} />}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main style={{ display: "flex", flex: 1, flexDirection: "column" }}>
        {/* Top header: title and FB login */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            background: darkMode ? "#0f1720" : "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>📲 Social Media Dashboard</h2>
            <span style={{ color: darkMode ? "#88a0c7" : "#4b5563", fontSize: 13 }}>{activeTab === "mentions" ? "Mentions" : activeTab === "posts" ? "Posts" : ""}</span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 13, color: darkMode ? "#cbd5e1" : "#374151", marginRight: 8 }}>{fbStatusMessage()}</div>
            <button
              onClick={() => handleFBLogin()}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                background: "#1877F2",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Login with Facebook
            </button>
          </div>
        </header>

        {/* Body content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left conversations / posts list */}
          <section style={{ width: 320, borderRight: "1px solid rgba(0,0,0,0.06)", overflowY: "auto", padding: 16, background: darkMode ? "#071226" : "#f9fbff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>{activeTab === "mentions" ? "Instagram Mentions" : "Instagram Posts"}</h3>
              <button
                onClick={() => (activeTab === "mentions" ? fetchMentions() : fetchPosts())}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: "#006CFC",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {activeTab === "mentions" && (
              <>
                {mentions.length === 0 ? (
                  <div style={{ textAlign: "center", paddingTop: 30, color: darkMode ? "#9aa7c7" : "#6b7280" }}>
                    <MessageSquare style={{ width: 48, height: 48, margin: "0 auto 12px" }} />
                    <div>No mentions yet</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Click Refresh to load</div>
                  </div>
                ) : (
                  mentions.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMessage(m)}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: 12,
                        borderRadius: 10,
                        cursor: "pointer",
                        marginBottom: 10,
                        background: selectedMessage?.id === m.id ? "#006CFC" : darkMode ? "#0b1a2b" : "#eef7ff",
                        color: selectedMessage?.id === m.id ? "#fff" : darkMode ? "#e6eefc" : "#0b1c3a",
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: "#c7d9ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                        {m.username ? m.username.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong>{m.username}</strong>
                          <small style={{ color: darkMode ? "#94a3b8" : "#6b7280", fontSize: 12 }}>{new Date(m.time).toLocaleString()}</small>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.message || "(no message)"}</div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === "posts" && (
              <>
                {posts.length === 0 ? (
                  <div style={{ textAlign: "center", paddingTop: 30, color: darkMode ? "#9aa7c7" : "#6b7280" }}>
                    <Layers style={{ width: 48, height: 48, margin: "0 auto 12px" }} />
                    <div>No posts yet</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Click Refresh to load</div>
                  </div>
                ) : (
                  posts.map((p) => (
                    <div key={p.id} style={{ marginBottom: 12 }}>
                      <div style={{ borderRadius: 10, overflow: "hidden", background: darkMode ? "#071226" : "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                        {p.mediaUrl && <img src={p.mediaUrl} alt="post" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />}
                        <div style={{ padding: 10 }}>
                          <div style={{ color: darkMode ? "#e6eefc" : "#0b1c3a", marginBottom: 8 }}>{p.caption?.slice(0, 120)}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <small style={{ color: darkMode ? "#9aa7c7" : "#6b7280" }}>{new Date(p.timestamp).toLocaleDateString()}</small>
                            {p.permalink && (
                              <a href={p.permalink} target="_blank" rel="noreferrer" style={{ color: "#ff2b2b", fontWeight: 700, textDecoration: "none" }}>
                                View on Instagram
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </section>

          {/* Chat / message viewer */}
          <section style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20, overflow: "hidden" }}>
            {selectedMessage ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: "#c7d9ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                      {selectedMessage.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{selectedMessage.username}</div>
                      <div style={{ fontSize: 13, color: darkMode ? "#9aa7c7" : "#6b7280" }}>Instagram</div>
                    </div>
                  </div>

                  <div>
                    {selectedMessage.permalink && (
                      <a href={selectedMessage.permalink} target="_blank" rel="noreferrer" style={{ color: "#ff2b2b", fontWeight: 700 }}>
                        View on Instagram <ExternalLink style={{ width: 14, height: 14, verticalAlign: "middle" }} />
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: 12, borderRadius: 10, background: darkMode ? "#071226" : "#fff", marginBottom: 12 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ marginBottom: 8, fontSize: 15 }}>{selectedMessage.message}</div>
                    {selectedMessage.mediaUrl && <img src={selectedMessage.mediaUrl} alt="mention" style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 8 }} />}
                    {selectedMessage.content && <div style={{ marginTop: 10, color: darkMode ? "#d8e6ff" : "#374151" }}>{selectedMessage.content}</div>}
                    <div style={{ marginTop: 12, fontSize: 12, color: darkMode ? "#94a3b8" : "#6b7280" }}>{new Date(selectedMessage.time).toLocaleString()}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                    placeholder="Type your reply and press Enter"
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid rgba(0,0,0,0.08)",
                      minHeight: 48,
                      resize: "vertical",
                      background: darkMode ? "#0b1a2b" : "#fff",
                      color: darkMode ? "#e6eefc" : "#0b1c3a",
                    }}
                  />
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim()}
                    style={{
                      background: "#006CFC",
                      color: "#fff",
                      border: "none",
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: replyText.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    <Send style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", margin: "auto", color: darkMode ? "#9aa7c7" : "#6b7280" }}>
                <MessageSquare style={{ width: 72, height: 72, margin: "0 auto 12px" }} />
                <div style={{ fontSize: 18, fontWeight: 600 }}>Select a mention to view</div>
                <div style={{ marginTop: 8, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
                  Choose a message from the left to start viewing and replying. Use the Refresh button to fetch latest mentions.
                </div>
              </div>
            )}
          </section>

          {/* Right profile / meta sidebar */}
          <aside style={{ width: 320, borderLeft: "1px solid rgba(0,0,0,0.06)", padding: 16, overflowY: "auto", background: darkMode ? "#06102a" : "#fff" }}>
            {selectedMessage ? (
              <>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 88, height: 88, borderRadius: 14, background: "#c7d9ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800 }}>
                    {selectedMessage.username?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedMessage.username}</div>
                  <div style={{ color: darkMode ? "#9aa7c7" : "#6b7280" }}>Instagram User</div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>Followers</div>
                    <div>1.2K</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>Messages</div>
                    <div>24</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>Last Active</div>
                    <div>Today</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#006CFC", color: "#fff", cursor: "pointer" }}>View Profile</button>
                  <button style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", background: "transparent", cursor: "pointer" }}>Block</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", color: darkMode ? "#9aa7c7" : "#6b7280" }}>
                <Users style={{ width: 48, height: 48, margin: "0 auto 12px" }} />
                <div style={{ fontWeight: 700 }}>No selection</div>
                <div style={{ marginTop: 6 }}>Select a conversation to view profile & stats</div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default App;