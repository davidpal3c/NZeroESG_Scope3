import axios from 'axios';



export const sendMessage = async (message: string): Promise<string> => {
    try {
        const response = await axios.post<string>(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`,
            { message },
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );  
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw new Error('Failed to send message');
    }
}


// export default class Api {
//   private static instance: Api;
//   private baseUrl: string;

//   private constructor() {
//     this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
//   }

//   public static getInstance(): Api {
//     if (!Api.instance) {
//       Api.instance = new Api();
//     }
//     return Api.instance;
//   }

//   public async get<T>(endpoint: string): Promise<T> {
//     const response = await axios.get<T>(`${this.baseUrl}${endpoint}`);
//     return response.data;
//   }

//   public async post<T>(endpoint: string, data: any): Promise<T> {
//     const response = await axios.post<T>(`${this.baseUrl}${endpoint}`, data);
//     return response.data;
//   }
// }