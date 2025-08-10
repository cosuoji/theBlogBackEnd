import jwt from "jsonwebtoken"
import { redis } from "../lib/redis.js"
import { v4 as uuidv4 } from "uuid"

export const generateTokens = (userId) => {
  const jti = uuidv4();

  const accessToken = jwt.sign({ userId, jti }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  const refreshToken = jwt.sign({ userId, jti }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  return { accessToken, refreshToken, jti };
};

export const storeRefreshToken = async (userId, refreshToken) => {
  try {
    await redis.set(`refresh_token:${userId}`, refreshToken, 'EX', 30 * 24 * 60 * 60); // 30 days
  } catch (err) {
    console.error('❌ Failed to store refresh token in Redis:', err.message);
  }
};

export const setCookies = (res, accessToken, refreshToken, rememberMe = false) => {
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  });
};
