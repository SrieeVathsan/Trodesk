const mockMentions = {
  facebook: {
    data: [
      {
        id: 'fb1',
        message: 'You were mentioned in a post!',
        created_time: '2025-07-18T10:00:00Z',
        permalink_url: 'https://facebook.com/post/1'
      }
    ]
  },
  instagram: {
    data: [
      {
        id: 'ig1',
        caption: 'Check this amazing design by @you',
        username: 'insta_user',
        permalink: 'https://instagram.com/post/1',
        media_url: 'https://via.placeholder.com/150'
      }
    ]
  },
  x: {
    data: [
      {
        id: 'x1',
        text: '@you Great work on the project!',
        created_at: '2025-07-18T09:00:00Z'
      }
    ],
    includes: {
      users: [
        {
          username: 'tech_guru',
          name: 'Tech Guru',
          profile_image_url: 'https://via.placeholder.com/50'
        }
      ]
    }
  }
};

export default mockMentions;