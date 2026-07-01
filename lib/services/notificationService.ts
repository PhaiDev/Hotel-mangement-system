import { getSettings } from '../repositories/settingsRepo';

type LineOaOptions = {
  channelAccessToken?: string | null;
  recipientId?: string | null;
};

export async function sendLineOaMessage(message: string, options: LineOaOptions = {}) {
  let channelAccessToken = options.channelAccessToken;
  let recipientId = options.recipientId;

  if (!channelAccessToken || !recipientId) {
    try {
      const settings = await getSettings();
      channelAccessToken = channelAccessToken || settings.lineOaChannelAccessToken;
      recipientId = recipientId || settings.lineOaRecipientId;
    } catch (error) {
      console.error('Error fetching settings for LINE OA:', error);
      return;
    }
  }

  if (!channelAccessToken) {
    console.warn('LINE OA channel access token is not set');
    return;
  }

  if (!recipientId) {
    console.warn('LINE OA recipient ID is not set');
    return;
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: recipientId,
        messages: [{ type: 'text', text: message }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LINE OA Messaging API error:', errorText);
    }
  } catch (error) {
    console.error('Error sending LINE OA message:', error);
  }
}
