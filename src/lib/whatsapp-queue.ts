// Queue untuk mengantri pesan WhatsApp
interface MessageQueue {
  receiver: string;
  message: string;
  timestamp: number;
}

// In-memory queue (dalam production bisa pakai Redis)
let messageQueue: MessageQueue[] = [];
let isProcessing = false;

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://api.moonwa.id/api/send-message';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || '';
const DELAY_BETWEEN_MESSAGES = 10000; // 10 detik

// Fungsi untuk mengirim pesan ke WhatsApp API
async function sendWhatsAppMessage(receiver: string, message: string) {
  if (!WHATSAPP_API_KEY) {
    throw new Error('WHATSAPP_API_KEY tidak dikonfigurasi di environment variable');
  }

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: WHATSAPP_API_KEY,
        receiver: receiver,
        data: {
          message: message,
        },
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send message');
    }

    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

// Fungsi untuk memproses antrian pesan
async function processQueue() {
  if (isProcessing || messageQueue.length === 0) {
    return;
  }

  isProcessing = true;

  while (messageQueue.length > 0) {
    const message = messageQueue.shift();
    if (!message) break;

    try {
      await sendWhatsAppMessage(message.receiver, message.message);
      console.log(`✅ Message sent to ${message.receiver}`);
    } catch (error) {
      console.error(`❌ Failed to send message to ${message.receiver}:`, error);
      // Bisa ditambahkan retry logic di sini jika diperlukan
    }

    // Delay 10 detik sebelum mengirim pesan berikutnya
    if (messageQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));
    }
  }

  isProcessing = false;
}

// Fungsi untuk menambahkan pesan ke antrian
export async function addToQueue(receiver: string, message: string): Promise<void> {
  // Validasi format nomor (harus dimulai dengan 62)
  const cleanReceiver = receiver.replace(/^0/, '62').replace(/[^0-9]/g, '');
  if (!cleanReceiver.startsWith('62')) {
    throw new Error('Format nomor tidak valid. Harus dimulai dengan 62');
  }

  // Tambahkan ke antrian
  messageQueue.push({
    receiver: cleanReceiver,
    message: message,
    timestamp: Date.now(),
  });

  // Mulai proses antrian jika belum berjalan
  processQueue().catch(error => {
    console.error('Error processing queue:', error);
  });
}

// Fungsi untuk mendapatkan status antrian
export function getQueueStatus() {
  return {
    queueLength: messageQueue.length,
    isProcessing: isProcessing,
    queue: messageQueue.map(m => ({
      receiver: m.receiver,
      timestamp: m.timestamp,
    })),
  };
}
















