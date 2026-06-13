import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL, timeout: 60000 });

export async function getTopics() {
  try {
    const response = await api.get("/api/topics");
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getTopicSummary(topicId) {
  try {
    const response = await api.get(`/api/topics/${topicId}/summary`);
    return response.data.summary;
  } catch (error) {
    throw error;
  }
}

export async function getTopicKeyInfo(topicId) {
  try {
    const response = await api.get(`/api/topics/${topicId}/keyinfo`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function askQuestion(topicId, question) {
  try {
    const response = await api.post(`/api/topics/${topicId}/ask`, { question });
    return response.data.answer;
  } catch (error) {
    throw error;
  }
}

export async function runPipeline() {
  try {
    const response = await api.post("/api/pipeline/run");
    return response.data;
  } catch (error) {
    throw error;
  }
}
