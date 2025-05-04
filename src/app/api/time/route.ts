import { NextResponse } from 'next/server';

export async function GET() {
  // Lấy thời gian hiện tại của server
  const now = new Date();
  
  // Chuyển đổi sang múi giờ +7
  const timeZone = 'Asia/Bangkok';
  const serverTime = new Date(now.toLocaleString('en-US', { timeZone }));
  
  return NextResponse.json({
    time: serverTime.toISOString(),
    timeZone: timeZone
  });
} 