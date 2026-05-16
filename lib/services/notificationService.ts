import { getSettings } from '../repositories/settingsRepo';

export async function sendLineNotify(message: string, token?: string | null) {
  let notifyToken = token;

  if (!notifyToken) {
    try {
      const settings = await getSettings();
      notifyToken = settings.lineNotifyToken;
    } catch (error) {
      console.error('Error fetching settings for LINE Notify:', error);
      return;
    }
  }

  if (!notifyToken) {
    console.warn('LINE Notify token is not set');
    return;
  }

  try {
    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${notifyToken}`,
      },
      body: new URLSearchParams({
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LINE Notify API error:', errorText);
    }
  } catch (error) {
    console.error('Error sending LINE Notify:', error);
  }
}
