import dotenv from 'dotenv'
dotenv.config()
export const CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
}
