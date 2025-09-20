// import React, { useState, useEffect, useRef } from "react";
// import {
//   MessageSquare,
//   Home,
//   FileText,
//   Layers,
//   Settings,
//   Sun,
//   Moon,
//   Send,
//   ExternalLink,
//   Users,
//   BarChart3,
//   //Hash,
//   //Calendar,
// } from "lucide-react";
// import axios from "axios";
// import "./App.css";

// const FB_SDK_POLL_INTERVAL = 300; // ms
// const FB_SDK_POLL_ATTEMPTS = 30; // total wait ~9s

// const App = () => {
//   const [mentions, setMentions] = useState([]);
//   const [posts, setPosts] = useState([]);
//   const [selectedMessage, setSelectedMessage] = useState(null);
//   const [replyText, setReplyText] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("mentions");
//   const [darkMode, setDarkMode] = useState(false);
//   const [fbReady, setFbReady] = useState(false);
//   const [fbStatus, setFbStatus] = useState(null);
//   const fbPollRef = useRef(0);

//   // Theme init - read from localStorage on mount
//   useEffect(() => {
//     const saved = localStorage.getItem("theme");
//     if (saved === "dark") setDarkMode(true);
//     else setDarkMode(false);
//   }, []);

//   // Persist theme
//   useEffect(() => {
//     localStorage.setItem("theme", darkMode ? "dark" : "light");
//   }, [darkMode]);

//   // Build FB SDK loader and login status checks
//   useEffect(() => {
//     // Avoid loading multiple times
//     if (window.FB) {
//       setFbReady(true);
//       // get status
//       window.FB.getLoginStatus((resp) => {
//         setFbStatus(resp?.status ?? "unknown");
//       });
//       return;
//     }

//     // Insert SDK script
//     window.fbAsyncInit = function () {
//       try {
//         window.FB.init({
//           appId: process.env.REACT_APP_FB_APP_ID || "", // set in .env
//           cookie: true,
//           xfbml: false,
//           version: "v23.0",
//         });
//         setFbReady(true);
//         window.FB.getLoginStatus((resp) => {
//           setFbStatus(resp?.status ?? "unknown");
//         });
//         console.info("FB SDK initialized");
//       } catch (err) {
//         console.error("FB init error:", err);
//         setFbReady(false);
//       }
//     };

//     (function (d, s, id) {
//       let js,
//         fjs = d.getElementsByTagName(s)[0];
//       if (d.getElementById(id)) return;
//       js = d.createElement(s);
//       js.id = id;
//       js.src = "https://connect.facebook.net/en_US/sdk.js";
//       fjs.parentNode.insertBefore(js, fjs);
//     })(document, "script", "facebook-jssdk");

//     // Poll to see if window.FB is ready (safe fallback if fbAsyncInit not called quickly)
//     fbPollRef.current = 0;
//     const poll = setInterval(() => {
//       fbPollRef.current += 1;
//       if (window.FB) {
//         setFbReady(true);
//         window.FB.getLoginStatus((resp) => setFbStatus(resp?.status ?? "unknown"));
//         clearInterval(poll);
//       } else if (fbPollRef.current > FB_SDK_POLL_ATTEMPTS) {
//         // stop trying
//         clearInterval(poll);
//         setFbReady(false);
//         console.warn("FB SDK not available. Make sure JSSDK option is enabled and appId is correct.");
//       }
//     }, FB_SDK_POLL_INTERVAL);

//     return () => clearInterval(poll);
//   }, []);

//   // Toggle theme helper
//   const toggleTheme = () => setDarkMode((p) => !p);

//   // Helper: clear selected message when switching away from mentions
//   useEffect(() => {
//     if (activeTab !== "mentions") {
//       setSelectedMessage(null);
//     }
//   }, [activeTab]);

//   // ---------------- Fetching functions ----------------
//   const fetchMentions = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get("http://localhost:8000/instagram/mentions");
//       const rawData = res.data?.data || [];

//       const mentionsFormatted = rawData.map((item, i) => ({
//         platform: "Instagram",
//         id: item.id || i,
//         message: item.text || item.caption || "",
//         content: item.caption || "",
//         time: item.timestamp || new Date().toISOString(),
//         mediaId: item.media_id || "",
//         username: item.username || "Unknown",
//         mediaUrl: item.media_url || "",
//         permalink: item.permalink || "",
//       }));

//       setMentions(mentionsFormatted);
//     } catch (err) {
//       console.error("Fetch Mentions error:", err);
//       alert("❌ Failed to fetch mentions. Check backend or network.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchPosts = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get("http://localhost:8000/instagram/posts");
//       const rawData = res.data?.data || [];

//       const postsFormatted = rawData.map((p, i) => ({
//         id: p.id || i,
//         caption: p.caption || "No caption",
//         mediaUrl: p.media_url || "",
//         permalink: p.permalink || "",
//         timestamp: p.timestamp || new Date().toISOString(),
//       }));

//       setPosts(postsFormatted);
//     } catch (err) {
//       console.error("Fetch Posts error:", err);
//       alert("❌ Failed to fetch posts. Check backend or network.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------------- Reply to mention ----------------
//   const handleReply = async () => {
//     if (!selectedMessage || !replyText.trim()) return;
//     try {
//       const form = new FormData();
//       form.append("media_id", selectedMessage.mediaId);
//       form.append("comment_text", replyText.trim());

//       await axios.post("http://localhost:8000/instagram/reply-to-mentions", form, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       alert("✅ Reply sent");
//       setReplyText("");
//     } catch (err) {
//       console.error("Reply error:", err);
//       alert("❌ Failed to send reply.");
//     }
//   };

//   // ---------------- Facebook login helpers ----------------
//   const handleFBLogin = (options = {}) => {
//     if (!fbReady || !window.FB) {
//       alert("Facebook SDK not ready. Make sure the SDK is loaded and JSSDK option enabled in your FB app settings.");
//       return;
//     }

//     // call FB.login and ask for business scopes
//     window.FB.login(
//       (response) => {
//         console.log("FB login response", response);
//         setFbStatus(response?.status ?? "unknown");
//         if (response.status === "connected") {
//           alert("✅ Logged in to Facebook (connected). You can now fetch pages/tokens.");
//           // you may want to send response.authResponse.accessToken to backend
//         } else if (response.status === "not_authorized") {
//           alert("⚠️ Not authorized. Grant required permissions and try again.");
//         } else {
//           // unknown or other states
//           alert("⚠️ Login not completed. Check console for details.");
//         }
//       },
//       {
//         scope: "ads_read,ads_management,pages_read_engagement,pages_show_list,instagram_basic",
//         return_scopes: true,
//         auth_type: "rerequest",
//         ...options,
//       }
//     );
//   };

//   // small helper to explain FB status to user
//   const fbStatusMessage = () => {
//     if (!fbReady) return "Facebook SDK not ready. Check appId and JSSDK setting.";
//     if (fbStatus === "connected") return "Facebook: connected";
//     if (fbStatus === "not_authorized") return "Facebook: logged in but not authorized";
//     if (fbStatus === "unknown" || fbStatus == null) return "Facebook: not logged in / unknown";
//     return `Facebook: ${fbStatus}`;
//   };

//   // ---------------- Render ----------------
//   return (
//     <div className={`app-root ${darkMode ? "dark" : "light"}`} style={{ height: "100vh", display: "flex" }}>
//       {/* Left Sidebar */}
//       <aside className="nav-sidebar">
//         <div className="nav-icon logo">
//           <img src="/logo.png" alt="logo" style={{ width: 28, height: 28 }} />
//         </div>

//         <button className={`nav-icon ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")} title="Home">
//           <Home style={{ width: 22, height: 22 }} />
//         </button>

//         <button className={`nav-icon ${activeTab === "mentions" ? "active" : ""}`} onClick={() => setActiveTab("mentions")} title="Mentions">
//           <MessageSquare style={{ width: 22, height: 22 }} />
//         </button>

//         <button className={`nav-icon ${activeTab === "posts" ? "active" : ""}`} onClick={() => setActiveTab("posts")} title="Posts">
//           <Layers style={{ width: 22, height: 22 }} />
//         </button>

//         <button className={`nav-icon ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")} title="Analytics">
//           <BarChart3 style={{ width: 22, height: 22 }} />
//         </button>

//         <button className={`nav-icon ${activeTab === "reports" ? "active" : ""}`} onClick={() => setActiveTab("reports")} title="Reports">
//           <FileText style={{ width: 22, height: 22 }} />
//         </button>

//         <button className={`nav-icon ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")} title="Settings">
//           <Settings style={{ width: 22, height: 22 }} />
//         </button>

//         {/* theme toggle at bottom */}
//         <div style={{ marginTop: "auto", paddingBottom: 12 }}>
//           <button className="theme-toggle" onClick={() => toggleTheme()} title="Toggle theme">
//             {darkMode ? <Sun style={{ width: 18, height: 18 }} /> : <Moon style={{ width: 18, height: 18 }} />}
//           </button>
//         </div>
//       </aside>

//       {/* Main area */}
//       <main style={{ display: "flex", flex: 1, flexDirection: "column" }}>
//         {/* Top header: title and FB login */}
//         <header
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             padding: "12px 20px",
//             borderBottom: "1px solid rgba(0,0,0,0.06)",
//             background: darkMode ? "#0f1720" : "#fff",
//           }}
//         >
//           <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//             <h2 style={{ margin: 0, fontSize: 18 }}>📲 Social Media Dashboard</h2>
//             <span style={{ color: darkMode ? "#88a0c7" : "#4b5563", fontSize: 13 }}>{activeTab === "mentions" ? "Mentions" : activeTab === "posts" ? "Posts" : ""}</span>
//           </div>

//           <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//             <div style={{ fontSize: 13, color: darkMode ? "#cbd5e1" : "#374151", marginRight: 8 }}>{fbStatusMessage()}</div>
//             <button
//               onClick={() => handleFBLogin()}
//               style={{
//                 padding: "8px 12px",
//                 borderRadius: 8,
//                 border: "none",
//                 background: "#1877F2",
//                 color: "#fff",
//                 fontWeight: 600,
//                 cursor: "pointer",
//               }}
//             >
//               Login with Facebook
//             </button>
//           </div>
//         </header>

//         {/* Body content */}
//         <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
//           {/* Left conversations / posts list */}
//           <section style={{ width: 320, borderRight: "1px solid rgba(0,0,0,0.06)", overflowY: "auto", padding: 16, background: darkMode ? "#071226" : "#f9fbff" }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
//               <h3 style={{ margin: 0 }}>{activeTab === "mentions" ? "Instagram Mentions" : "Instagram Posts"}</h3>
//               <button
//                 onClick={() => (activeTab === "mentions" ? fetchMentions() : fetchPosts())}
//                 style={{
//                   padding: "6px 10px",
//                   borderRadius: 8,
//                   border: "none",
//                   background: "#006CFC",
//                   color: "#fff",
//                   cursor: "pointer",
//                 }}
//               >
//                 {loading ? "Loading..." : "Refresh"}
//               </button>
//             </div>

//             {activeTab === "mentions" && (
//               <>
//                 {mentions.length === 0 ? (
//                   <div style={{ textAlign: "center", paddingTop: 30, color: darkMode ? "#9aa7c7" : "#6b7280" }}>
//                     <MessageSquare style={{ width: 48, height: 48, margin: "0 auto 12px" }} />
//                     <div>No mentions yet</div>
//                     <div style={{ fontSize: 13, marginTop: 6 }}>Click Refresh to load</div>
//                   </div>
//                 ) : (
//                   mentions.map((m) => (
//                     <div
//                       key={m.id}
//                       onClick={() => setSelectedMessage(m)}
//                       style={{
//                         display: "flex",
//                         gap: 10,
//                         padding: 12,
//                         borderRadius: 10,
//                         cursor: "pointer",
//                         marginBottom: 10,
//                         background: selectedMessage?.id === m.id ? "#006CFC" : darkMode ? "#0b1a2b" : "#eef7ff",
//                         color: selectedMessage?.id === m.id ? "#fff" : darkMode ? "#e6eefc" : "#0b1c3a",
//                       }}
//                     >
//                       <div style={{ width: 44, height: 44, borderRadius: 8, background: "#c7d9ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
//                         {m.username ? m.username.charAt(0).toUpperCase() : "U"}
//                       </div>
//                       <div style={{ flex: 1 }}>
//                         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                           <strong>{m.username}</strong>
//                           <small style={{ color: darkMode ? "#94a3b8" : "#6b7280", fontSize: 12 }}>{new Date(m.time).toLocaleString()}</small>
//                         </div>
//                         <div style={{ marginTop: 6, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.message || "(no message)"}</div>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </>
//             )}

//             {activeTab === "posts" && (
//               <>
//                 {posts.length === 0 ? (
//                   <div style={{ textAlign: "center", paddingTop: 30, color: darkMode ? "#9aa7c7" : "#6b7280" }}>
//                     <Layers style={{ width: 48, height: 48, margin: "0 auto 12px" }} />
//                     <div>No posts yet</div>
//                     <div style={{ fontSize: 13, marginTop: 6 }}>Click Refresh to load</div>
//                   </div>
//                 ) : (
//                   posts.map((p) => (
//                     <div key={p.id} style={{ marginBottom: 12 }}>
//                       <div style={{ borderRadius: 10, overflow: "hidden", background: darkMode ? "#071226" : "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
//                         {p.mediaUrl && <img src={p.mediaUrl} alt="post" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />}
//                         <div style={{ padding: 10 }}>
//                           <div style={{ color: darkMode ? "#e6eefc" : "#0b1c3a", marginBottom: 8 }}>{p.caption?.slice(0, 120)}</div>
//                           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                             <small style={{ color: darkMode ? "#9aa7c7" : "#6b7280" }}>{new Date(p.timestamp).toLocaleDateString()}</small>
//                             {p.permalink && (
//                               <a href={p.permalink} target="_blank" rel="noreferrer" style={{ color: "#ff2b2b", fontWeight: 700, textDecoration: "none" }}>
//                                 View on Instagram
//                               </a>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </>
//             )}
//           </section>

//           {/* Chat / message viewer */}
//           <section style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20, overflow: "hidden" }}>
//             {selectedMessage ? (
//               <>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
//                   <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
//                     <div style={{ width: 48, height: 48, borderRadius: 10, background: "#c7d9ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
//                       {selectedMessage.username?.charAt(0).toUpperCase() || "U"}
//                     </div>
//                     <div>
//                       <div style={{ fontWeight: 700 }}>{selectedMessage.username}</div>
//                       <div style={{ fontSize: 13, color: darkMode ? "#9aa7c7" : "#6b7280" }}>Instagram</div>
//                     </div>
//                   </div>

//                   <div>
//                     {selectedMessage.permalink && (
//                       <a href={selectedMessage.permalink} target="_blank" rel="noreferrer" style={{ color: "#ff2b2b", fontWeight: 700 }}>
//                         View on Instagram <ExternalLink style={{ width: 14, height: 14, verticalAlign: "middle" }} />
//                       </a>
//                     )}
//                   </div>
//                 </div>

//                 <div style={{ flex: 1, overflowY: "auto", padding: 12, borderRadius: 10, background: darkMode ? "#071226" : "#fff", marginBottom: 12 }}>
//                   <div style={{ marginBottom: 12 }}>
//                     <div style={{ marginBottom: 8, fontSize: 15 }}>{selectedMessage.message}</div>
//                     {selectedMessage.mediaUrl && <img src={selectedMessage.mediaUrl} alt="mention" style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 8 }} />}
//                     {selectedMessage.content && <div style={{ marginTop: 10, color: darkMode ? "#d8e6ff" : "#374151" }}>{selectedMessage.content}</div>}
//                     <div style={{ marginTop: 12, fontSize: 12, color: darkMode ? "#94a3b8" : "#6b7280" }}>{new Date(selectedMessage.time).toLocaleString()}</div>
//                   </div>
//                 </div>

//                 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//                   <textarea
//                     value={replyText}
//                     onChange={(e) => setReplyText(e.target.value)}
//                     onKeyDown={(e) => {
//                       if (e.key === "Enter" && !e.shiftKey) {
//                         e.preventDefault();
//                         handleReply();
//                       }
//                     }}
//                     placeholder="Type your reply and press Enter"
//                     style={{
//                       flex: 1,
//                       padding: 12,
//                       borderRadius: 8,
//                       border: "1px solid rgba(0,0,0,0.08)",
//                       minHeight: 48,
//                       resize: "vertical",
//                       background: darkMode ? "#0b1a2b" : "#fff",
//                       color: darkMode ? "#e6eefc" : "#0b1c3a",
//                     }}
//                   />
//                   <button
//                     onClick={handleReply}
//                     disabled={!replyText.trim()}
//                     style={{
//                       background: "#006CFC",
//                       color: "#fff",
//                       border: "none",
//                       padding: "10px 12px",
//                       borderRadius: 8,
//                       cursor: replyText.trim() ? "pointer" : "not-allowed",
//                     }}
//                   >
//                     <Send style={{ width: 16, height: 16 }} />
//                   </button>
//                 </div>
//               </>
//             ) : (
//               <div style={{ textAlign: "center", margin: "auto", color: darkMode ? "#9aa7c7" : "#6b7280" }}>
//                 <MessageSquare style={{ width: 72, height: 72, margin: "0 auto 12px" }} />
//                 <div style={{ fontSize: 18, fontWeight: 600 }}>Select a mention to view</div>
//                 <div style={{ marginTop: 8, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
//                   Choose a message from the left to start viewing and replying. Use the Refresh button to fetch latest mentions.
//                 </div>
//               </div>
//             )}
//           </section>

//           {/* Right profile / meta sidebar */}
//           <aside style={{ width: 320, borderLeft: "1px solid rgba(0,0,0,0.06)", padding: 16, overflowY: "auto", background: darkMode ? "#06102a" : "#fff" }}>
//             {selectedMessage ? (
//               <>
//                 <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
//                   <div style={{ width: 88, height: 88, borderRadius: 14, background: "#c7d9ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800 }}>
//                     {selectedMessage.username?.charAt(0).toUpperCase()}
//                   </div>
//                   <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedMessage.username}</div>
//                   <div style={{ color: darkMode ? "#9aa7c7" : "#6b7280" }}>Instagram User</div>
//                 </div>

//                 <div style={{ marginTop: 18 }}>
//                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
//                     <div style={{ fontWeight: 700 }}>Followers</div>
//                     <div>1.2K</div>
//                   </div>
//                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
//                     <div style={{ fontWeight: 700 }}>Messages</div>
//                     <div>24</div>
//                   </div>
//                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
//                     <div style={{ fontWeight: 700 }}>Last Active</div>
//                     <div>Today</div>
//                   </div>
//                 </div>

//                 <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
//                   <button style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#006CFC", color: "#fff", cursor: "pointer" }}>View Profile</button>
//                   <button style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", background: "transparent", cursor: "pointer" }}>Block</button>
//                 </div>
//               </>
//             ) : (
//               <div style={{ textAlign: "center", color: darkMode ? "#9aa7c7" : "#6b7280" }}>
//                 <Users style={{ width: 48, height: 48, margin: "0 auto 12px" }} />
//                 <div style={{ fontWeight: 700 }}>No selection</div>
//                 <div style={{ marginTop: 6 }}>Select a conversation to view profile & stats</div>
//               </div>
//             )}
//           </aside>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default App;

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Home,
  FileText,
  Image,
  Layers,
  Settings,
  Sun,
  Moon,
  Send,
  Users,
  BarChart3,
  Mail,
} from "lucide-react";
import "./App.css";
import logo from './assets/logo.png';

// --- FAKE DATA ---
// const FAKE_USERS = [
//   "alice_insta",
//   "bob_the_builder",
//   "charlie_dev",
// ];

const FAKE_MENTIONS = [
  {
    platform: "Instagram",
    id: "m_1",
    message: "@troudz I just tried out this product and honestly, I’m impressed! The quality is better than I expected, it feels durable, and it works exactly as described. Shipping was fast and the packaging was neat. Definitely worth the price — I’d recommend this to anyone looking for something reliable. ⭐⭐⭐⭐⭐",
    time: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    mediaId: "media_1",
    username: "alice_insta",
    avatar: "https://picsum.photos/seed/product1/300/200",
    mediaUrl: "https://picsum.photos/seed/computer2/300/200",
    permalink: "https://instagram.com/p/fake1",
    replies: [
      {
        id: "r_1",
        text: "Thank you so much for the wonderful feedback! 🌟 We’re glad to know you’re enjoying the product and had a smooth experience. Your support means a lot to us! 💙",
        time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        author: "You",
      }
    ],
  },
  {
    platform: "Instagram",
    id: "m_2",
    message: "@troudz I gave this product a shot, but unfortunately, it didn’t meet my expectations. The build felt a bit flimsy, and it didn’t perform as well as I hoped. Delivery also took longer than expected. For the price, I think there are better alternatives out there.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    mediaId: "media_2",
    username: "bob_the_builder",
    avatar: "https://picsum.photos/seed/jessica/100/100",
    mediaUrl: "https://picsum.photos/seed/computer2/300/200",
    permalink: "https://instagram.com/p/fake2",
    replies: [
      {
        id: "r_2",
        text: "Sorry to hear this 😔. We’d love to fix things for you — check your DM so we can sort this out right away ✅",
        time: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        author: "You",
      }
    ],
  },
  {
    platform: "Instagram",
    id: "m_3",
    message: "@troudz I gave this product a shot, but unfortunately, it didn’t meet my expectations. The build felt a bit flimsy, and it didn’t perform as well as I hoped. Delivery also took longer than expected. For the price, I think there are better alternatives out there.",
    time: new Date().toISOString(),
    mediaId: "media_3",
    username: "mike_tyson",
    avatar: "https://picsum.photos/seed/mike/100/100",
    mediaUrl: "https://picsum.photos/seed/computer2/300/200",
    permalink: "https://instagram.com/p/fake3",
    replies: [
      {
        id: "r_3",
        text: "Sorry to hear this 😔. We’d love to fix things for you — check your DM so we can sort this out right away ✅",
        time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        author: "You",
      }
    ],
  },
  {
    platform: "Instagram",
    id: "m_4",
    message: "@troudz I gave this product a shot, but unfortunately, it didn’t meet my expectations. The build felt a bit flimsy, and it didn’t perform as well as I hoped. Delivery also took longer than expected. For the price, I think there are better alternatives out there.",
    time: new Date().toISOString(),
    mediaId: "media_3",
    username: "sarah_connor",
    avatar: "https://picsum.photos/seed/sarah/100/100",
    mediaUrl: "https://picsum.photos/seed/computer2/300/200",
    permalink: "https://instagram.com/p/fake3",
    replies: [
      {
        id: "r_3",
        text: "Sorry to hear this 😔. We’d love to fix things for you — check your DM so we can sort this out right away ✅",
        time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        author: "You",
      }
    ],
  },
];

const FAKE_DMS = [
  {
    id: "dm_1",
    username: "bob_the_builder",
    fullName: "Jessica Parker",
    avatar: "https://picsum.photos/seed/jessica/100/100",
    lastMessage: "Here are my order details: #12345, shipped on Sept 16.",
    time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unread: 1,
    messages: [
      {
        id: "msg_1",
        text: "We’re sorry to hear that your experience wasn’t what you expected 😔. We value your feedback and would love to make this right — please DM us your order details so we can assist you further. 🙏",
        time: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        sender: "jessica_92",
        isMe: true
      },
      {
        id: "msg_2",
        text: "Here are my order details: #12345, shipped on Sept 16.",
        time: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        sender: "You",
        isMe: false
      },
    ]
  },
  {
    id: "dm_2",
    username: "mike_tyson",
    fullName: "Mike Tyson",
    avatar: "https://picsum.photos/seed/mike/100/100",
    lastMessage: "Here are my order details: #34567, shipped on Sept 17.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    unread: 1,
    messages: [
      {
        id: "msg_4",
        text: "We’re sorry to hear that your experience wasn’t what you expected 😔. We value your feedback and would love to make this right — please DM us your order details so we can assist you further. 🙏",
        time: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        sender: "jessica_92",
        isMe: true
      },
      {
        id: "msg_5",
        text: "Here are my order details: #34567, shipped on Sept 17.",
        time: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        sender: "You",
        isMe: false
      },
    ]
  },
  {
    id: "dm_3",
    username: "sarah_connor",
    fullName: "Sarah Connor",
    avatar: "https://picsum.photos/seed/sarah/100/100",
    lastMessage: "Here are my order details: #12345, shipped on Sept 18.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    unread: 1,
    messages: [
      {
        id: "msg_7",
        text: "We’re sorry to hear that your experience wasn’t what you expected 😔. We value your feedback and would love to make this right — please DM us your order details so we can assist you further. 🙏",
        time: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        sender: "jessica_92",
        isMe: true
      },
      {
        id: "msg_8",
        text: "Here are my order details: #34567, shipped on Sept 18.",
        time: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        sender: "You",
        isMe: false
      },
    ]
  }
];

const FAKE_POSTS = [
  {
    id: "p_1",
    caption: "Launch day — thank you everyone!",
    mediaUrl: "https://picsum.photos/seed/post1/800/420",
    permalink: "https://instagram.com/p/post1",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const App = () => {
  const [mentions, setMentions] = useState([]);
  const [dms, setDms] = useState(FAKE_DMS);
  const [posts, setPosts] = useState(FAKE_POSTS.map((p) => ({ ...p })));
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedDm, setSelectedDm] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [dmText, setDmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("mentions");
  const [darkMode, setDarkMode] = useState(false);
  const [fbUser, setFbUser] = useState(null);

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

  // Toggle theme helper
  const toggleTheme = () => setDarkMode((p) => !p);

  // Helper: clear selected message when switching away from mentions/DMs
  useEffect(() => {
    if (activeTab !== "mentions" && activeTab !== "dms") {
      setSelectedMessage(null);
      setSelectedDm(null);
    }
  }, [activeTab]);

  // ---------------- Fetching functions ----------------
  const fetchMentions = async () => {
    if (!fbUser) {
      alert("Please login first to view mentions");
      return;
    }
    
    setLoading(true);
    setMentions(FAKE_MENTIONS.map((m) => ({ ...m })));
    setTimeout(() => setLoading(false), 500);
  };

  const fetchDms = async () => {
    if (!fbUser) {
      alert("Please login first to view messages");
      return;
    }
    
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const fetchPosts = async () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  // ---------------- Reply to mention ----------------
  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    // append reply locally so user sees it immediately
    const reply = {
      id: `r_${Date.now()}`,
      text: replyText.trim(),
      time: new Date().toISOString(),
      author: fbUser?.name || "You",
    };

    setMentions((prev) => prev.map((m) => (m.id === selectedMessage.id ? { ...m, replies: [...(m.replies || []), reply] } : m)));

    // update selectedMessage reference so viewer shows it
    setSelectedMessage((prev) => (prev ? { ...prev, replies: [...(prev.replies || []), reply] } : prev));

    setReplyText("");
  };

  // ---------------- Send DM ----------------
  const handleSendDm = async () => {
    if (!selectedDm || !dmText.trim()) return;

    // append message locally so user sees it immediately
    const newMessage = {
      id: `dm_msg_${Date.now()}`,
      text: dmText.trim(),
      time: new Date().toISOString(),
      sender: "You",
      isMe: true
    };

    setDms((prev) => prev.map((dm) => 
      dm.id === selectedDm.id 
        ? { 
            ...dm, 
            messages: [...dm.messages, newMessage],
            lastMessage: dmText.trim(),
            time: new Date().toISOString()
          } 
        : dm
    ));

    // update selectedDm reference so viewer shows it
    setSelectedDm((prev) => 
      prev 
        ? { 
            ...prev, 
            messages: [...prev.messages, newMessage],
            lastMessage: dmText.trim(),
            time: new Date().toISOString()
          } 
        : prev
    );

    setDmText("");
  };

  const handleDmClick = (dm) => {
  setSelectedDm(dm);
  
  // Mark as read (set unread to 0)
  setDms(prev => prev.map(item => 
    item.id === dm.id ? { ...item, unread: 0 } : item
  ));
};

  // ---------------- Login helpers ----------------
  const randomFakeUser = () => {
  return { id: "u_1234", name: "srieevathsan.dev" };
};

  const handleLogin = () => {
    const u = randomFakeUser();
    setFbUser(u);
    
    // Load mentions after login
    setMentions(FAKE_MENTIONS.map((m) => ({ ...m })));
  };

  const handleLogout = () => {
    setFbUser(null);
    setMentions([]);
    setSelectedMessage(null);
    setSelectedDm(null);
  };

  // ---------------- Render ----------------
  return (
    <div className={`app-root ${darkMode ? "dark" : "light"}`} style={{ height: "100vh", display: "flex" }}>
      {/* Left Sidebar */}
      <aside className="nav-sidebar">
        <div className="nav-icon logo">
          <img src={logo} alt="logo" style={{ width: 28, height: 28 }} />
        </div>

        <button className={`nav-icon ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")} title="Home">
          <Home style={{ width: 22, height: 22 }} />
        </button>

        <button className={`nav-icon ${activeTab === "mentions" ? "active" : ""}`} onClick={() => setActiveTab("mentions")} title="Mentions">
          <MessageSquare style={{ width: 22, height: 22 }} />
        </button>

        <button className={`nav-icon ${activeTab === "dms" ? "active" : ""}`} onClick={() => setActiveTab("dms")} title="Direct Messages">
          <Mail style={{ width: 22, height: 22 }} />
        </button>

        <button className={`nav-icon ${activeTab === "posts" ? "active" : ""}`} onClick={() => setActiveTab("posts")} title="Posts">
          <Image style={{ width: 22, height: 22 }} />
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

        <div style={{ marginTop: "auto", paddingBottom: 12 }}>
          <button className="theme-toggle" onClick={() => toggleTheme()} title="Toggle theme">
            {darkMode ? <Sun style={{ width: 18, height: 18 }} /> : <Moon style={{ width: 18, height: 18 }} />}
          </button>
        </div>
      </aside>

      <main style={{ display: "flex", flex: 1, flexDirection: "column" }}>
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
            <span style={{ color: darkMode ? "#88a0c7" : "#4b5563", fontSize: 13 }}>
              {activeTab === "mentions" ? "Mentions" : 
               activeTab === "dms" ? "Direct Messages" : 
               activeTab === "posts" ? "Posts" : ""}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 13, color: darkMode ? "#cbd5e1" : "#374151", marginRight: 8 }}>
              {fbUser ? `Logged in as: ${fbUser.name}` : "Not logged in"}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {fbUser ? (
                <>
                  <div style={{ fontSize: 13, color: darkMode ? "#dbeafe" : "#1f2937", fontWeight: 600 }}>{fbUser.name}</div>
                  <button
                    onClick={handleLogout}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "#dc2626",
                      color: "#fff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
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
                  Login to Facebook
                </button>
              )}
            </div>
          </div>
        </header>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <section style={{ width: 320, borderRight: "1px solid rgba(0,0,0,0.06)", overflowY: "auto", padding: 16, background: darkMode ? "#071226" : "#f9fbff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>
                {activeTab === "mentions" ? "Instagram Mentions" : 
                 activeTab === "dms" ? "Direct Messages" : 
                 "Instagram Posts"}
              </h3>
              <button
                onClick={() => {
                  if (activeTab === "mentions") fetchMentions();
                  else if (activeTab === "dms") fetchDms();
                  else fetchPosts();
                }}
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
                {!fbUser ? (
                  <div style={{ textAlign: "center", paddingTop: 30, color: darkMode ? "#9aa7c7" : "#6b7280" }}>
                    <MessageSquare style={{ width: 48, height: 48, margin: "0 auto 12px" }} />
                    <div>Please login to view mentions</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Click the login button above</div>
                  </div>
                ) : mentions.length === 0 ? (
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
                        <div style={{ marginTop: 6, fontSize: 14, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.message || "(no message)"}</div>
                        {m.replies && m.replies.length > 0 && (
                          <div style={{ marginTop: 4, fontSize: 12, color: darkMode ? "#88a0c7" : "#4b5563", display: "flex", alignItems: "center", gap: 4 }}>
                            <MessageSquare size={12} /> {m.replies.length} reply
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === "dms" && (
              <>
                {!fbUser ? (
                  <div style={{ textAlign: "center", paddingTop: 30, color: darkMode ? "#9aa7c7" : "#6b7280" }}>
                    <Mail style={{ width: 48, height: 48, margin: "0 auto 12px" }} />
                    <div>Please login to view messages</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Click the login button above</div>
                  </div>
                ) : dms.length === 0 ? (
                  <div style={{ textAlign: "center", paddingTop: 30, color: darkMode ? "#9aa7c7" : "#6b7280" }}>
                    <Mail style={{ width: 48, height: 48, margin: "0 auto 12px" }} />
                    <div>No messages yet</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Click Refresh to load</div>
                  </div>
                ) : (
                  dms.map((dm) => (
                    <div
                      key={dm.id}
                      onClick={() => handleDmClick(dm)}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: 12,
                        borderRadius: 10,
                        cursor: "pointer",
                        marginBottom: 10,
                        background: selectedDm?.id === dm.id ? "#006CFC" : darkMode ? "#0b1a2b" : "#eef7ff",
                        color: selectedDm?.id === dm.id ? "#fff" : darkMode ? "#e6eefc" : "#0b1c3a",
                      }}
                    >
                      <img 
                        src={dm.avatar} 
                        alt={dm.username} 
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} 
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong>{dm.username}</strong>
                          {dm.unread > 0 && (
                            <span style={{ 
                              background: "#ef4444", 
                              color: "white", 
                              borderRadius: "50%", 
                              width: 20, 
                              height: 20, 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              fontSize: 12 
                            }}>
                              {dm.unread}
                            </span>
                          )}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 14, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{dm.lastMessage}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: darkMode ? "#94a3b8" : "#6b7280" }}>
                          {new Date(dm.time).toLocaleString()}
                        </div>
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
            {activeTab === "mentions" && selectedMessage ? (
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
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: 12, borderRadius: 10, background: darkMode ? "#071226" : "#fff", marginBottom: 12 }}>
                  {/* Original message from user (left side) */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                      <div style={{ 
                        maxWidth: "70%", 
                        padding: "12px 16px", 
                        borderRadius: "18px 18px 18px 4px", 
                        background: darkMode ? "#1e293b" : "#f1f5f9",
                        color: darkMode ? "#e2e8f0" : "#334155"
                      }}>
                        <div style={{ marginBottom: 8, fontSize: 15 }}>{selectedMessage.message}</div>
                        {selectedMessage.mediaUrl && (
                          <div style={{ margin: "10px 0", textAlign: "center" }}>
                            <img 
                              src={selectedMessage.mediaUrl} 
                              alt="mention" 
                              style={{ 
                                maxWidth: "100%", 
                                maxHeight: 200, 
                                borderRadius: 12, 
                                objectFit: "cover",
                                border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`
                              }} 
                            />
                          </div>
                        )}
                        <div style={{ marginTop: 12, fontSize: 12, color: darkMode ? "#94a3b8" : "#64748b", textAlign: "right" }}>
                          {new Date(selectedMessage.time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Replies list (right side for user replies) */}
                  {(selectedMessage.replies || []).length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontWeight: 700, marginBottom: 8, paddingLeft: 8 }}>Replies</div>
                      {(selectedMessage.replies || []).map((r) => (
                        <div key={r.id} style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
                          <div style={{ 
                            maxWidth: "70%", 
                            padding: "12px 16px", 
                            borderRadius: "18px 18px 4px 18px", 
                            background: "#006CFC",
                            color: "#fff"
                          }}>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{r.author}</div>
                            <div style={{ fontSize: 14 }}>{r.text}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", textAlign: "right", marginTop: 6 }}>
                              {new Date(r.time).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
            ) : activeTab === "dms" && selectedDm ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <img 
                      src={selectedDm.avatar} 
                      alt={selectedDm.username} 
                      style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} 
                    />
                    <div>
                      <div style={{ fontWeight: 700 }}>{selectedDm.username}</div>
                      <div style={{ fontSize: 13, color: darkMode ? "#9aa7c7" : "#6b7280" }}>{selectedDm.fullName}</div>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: 12, borderRadius: 10, background: darkMode ? "#071226" : "#fff", marginBottom: 12 }}>
                  {/* DM messages */}
                  {selectedDm.messages.map((msg) => (
                    <div key={msg.id} style={{ marginBottom: 12, display: "flex", justifyContent: msg.isMe ? "flex-end" : "flex-start" }}>
                      <div style={{ 
                        maxWidth: "70%", 
                        padding: "12px 16px", 
                        borderRadius: msg.isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", 
                        background: msg.isMe ? "#006CFC" : (darkMode ? "#1e293b" : "#f1f5f9"),
                        color: msg.isMe ? "#fff" : (darkMode ? "#e2e8f0" : "#334155")
                      }}>
                        {!msg.isMe && (
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{msg.sender}</div>
                        )}
                        <div style={{ fontSize: 14 }}>{msg.text}</div>
                        <div style={{ 
                          fontSize: 11, 
                          textAlign: "right", 
                          marginTop: 6,
                          color: msg.isMe ? "rgba(255,255,255,0.7)" : (darkMode ? "#94a3b8" : "#64748b")
                        }}>
                          {new Date(msg.time).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <textarea
                    value={dmText}
                    onChange={(e) => setDmText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendDm();
                      }
                    }}
                    placeholder="Type your message and press Enter"
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
                    onClick={handleSendDm}
                    disabled={!dmText.trim()}
                    style={{
                      background: "#006CFC",
                      color: "#fff",
                      border: "none",
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: dmText.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    <Send style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", margin: "auto", color: darkMode ? "#9aa7c7" : "#6b7280" }}>
                {activeTab === "mentions" ? (
                  <>
                    <MessageSquare style={{ width: 72, height: 72, margin: "0 auto 12px" }} />
                    <div style={{ fontSize: 18, fontWeight: 600 }}>
                      {fbUser ? "Select a mention to view" : "Login to view mentions"}
                    </div>
                    <div style={{ marginTop: 8, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
                      {fbUser 
                        ? "Choose a message from the left to start viewing and replying. Use the Refresh button to fetch latest mentions."
                        : "Please login using the button in the header to view and reply to mentions."
                      }
                    </div>
                  </>
                ) : activeTab === "dms" ? (
                  <>
                    <Mail style={{ width: 72, height: 72, margin: "0 auto 12px" }} />
                    <div style={{ fontSize: 18, fontWeight: 600 }}>
                      {fbUser ? "Select a conversation to view" : "Login to view messages"}
                    </div>
                    <div style={{ marginTop: 8, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
                      {fbUser 
                        ? "Choose a conversation from the left to start messaging."
                        : "Please login using the button in the header to view and send messages."
                      }
                    </div>
                  </>
                ) : (
                  <>
                    <Layers style={{ width: 72, height: 72, margin: "0 auto 12px" }} />
                    <div style={{ fontSize: 18, fontWeight: 600 }}>Posts Overview</div>
                    <div style={{ marginTop: 8, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
                      View your Instagram posts and their performance metrics.
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {/* Right profile / meta sidebar */}
          <aside style={{ width: 320, borderLeft: "1px solid rgba(0,0,0,0.06)", padding: 16, overflowY: "auto", background: darkMode ? "#06102a" : "#fff" }}>
            {activeTab === "mentions" && selectedMessage ? (
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
            ) : activeTab === "dms" && selectedDm ? (
              <>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <img 
                    src={selectedDm.avatar} 
                    alt={selectedDm.username} 
                    style={{ width: 88, height: 88, borderRadius: 14, objectFit: "cover" }} 
                  />
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedDm.username}</div>
                  <div style={{ color: darkMode ? "#9aa7c7" : "#6b7280" }}>{selectedDm.fullName}</div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>Followers</div>
                    <div>3.5K</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>Following</div>
                    <div>892</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>Posts</div>
                    <div>127</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>Last Active</div>
                    <div>30 min ago</div>
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
                <div style={{ marginTop: 6 }}>
                  {activeTab === "mentions" 
                    ? "Select a mention to view profile & stats" 
                    : activeTab === "dms"
                    ? "Select a conversation to view profile & stats"
                    : "Select an item to view details"
                  }
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default App;