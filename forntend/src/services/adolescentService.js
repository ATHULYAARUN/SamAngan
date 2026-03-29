import { apiCall } from '../utils/apiClient';

const adolescentService = {
  getDashboardData: async (name) => {
    const safeName = encodeURIComponent(String(name || '').trim());
    const response = await apiCall(`/asha/adolescent-dashboard/${safeName}`);
    return response;
  },
  getChatMessages: async (name) => {
    const safeName = encodeURIComponent(String(name || '').trim());
    return apiCall(`/asha/adolescent-chat/${safeName}`);
  },
  sendChatMessage: async (name, message) => {
    const safeName = encodeURIComponent(String(name || '').trim());
    return apiCall(`/asha/adolescent-chat/${safeName}`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },
  markChatRead: async (name) => {
    const safeName = encodeURIComponent(String(name || '').trim());
    return apiCall(`/asha/adolescent-chat/${safeName}/read`, {
      method: 'PATCH'
    });
  }
};

export default adolescentService;
