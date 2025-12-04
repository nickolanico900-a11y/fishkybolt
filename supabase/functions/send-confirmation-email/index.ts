import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string;
  firstName: string;
  lastName: string;
  packageName: string;
  packagePrice: number;
  positions: number[];
  orderId: string;
  transactionNumber?: string;
  siteUrl?: string;
}

async function sendEmailViaGmail(
  to: string,
  subject: string,
  htmlBody: string,
  gmailUser: string,
  gmailPassword: string
) {
  console.log('Starting SMTP connection to Gmail...');
  
  let conn;
  try {
    conn = await Deno.connect({
      hostname: "smtp.gmail.com",
      port: 587,
    });
    console.log('Connected to SMTP server');
  } catch (error) {
    console.error('Failed to connect to SMTP server:', error);
    throw new Error(`SMTP connection failed: ${error.message}`);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function readResponse(): Promise<string> {
    const buffer = new Uint8Array(1024);
    const n = await conn.read(buffer);
    const response = decoder.decode(buffer.subarray(0, n || 0));
    console.log('SMTP Response:', response.trim());
    return response;
  }

  async function sendCommand(command: string) {
    console.log('SMTP Command:', command.replace(/AUTH LOGIN|[A-Za-z0-9+/=]{20,}/, '[REDACTED]'));
    await conn.write(encoder.encode(command + "\r\n"));
    return await readResponse();
  }

  try {
    await readResponse();
    await sendCommand("EHLO localhost");
    await sendCommand("STARTTLS");

    console.log('Starting TLS...');
    const tlsConn = await Deno.startTls(conn, { hostname: "smtp.gmail.com" });
    console.log('TLS established');

    async function tlsReadResponse(): Promise<string> {
      const buffer = new Uint8Array(1024);
      const n = await tlsConn.read(buffer);
      const response = decoder.decode(buffer.subarray(0, n || 0));
      console.log('TLS SMTP Response:', response.trim());
      return response;
    }

    async function tlsSendCommand(command: string) {
      console.log('TLS SMTP Command:', command.replace(/AUTH LOGIN|[A-Za-z0-9+/=]{20,}/, '[REDACTED]'));
      await tlsConn.write(encoder.encode(command + "\r\n"));
      return await tlsReadResponse();
    }

    await tlsSendCommand("EHLO localhost");
    
    console.log('Authenticating...');
    await tlsSendCommand("AUTH LOGIN");
    const userResp = await tlsSendCommand(btoa(gmailUser));
    
    if (userResp.includes('334')) {
      console.log('Username accepted, sending password...');
    } else {
      throw new Error('Username not accepted');
    }
    
    const passResp = await tlsSendCommand(btoa(gmailPassword));
    
    if (passResp.includes('235')) {
      console.log('Authentication successful');
    } else {
      throw new Error('Authentication failed');
    }
    
    await tlsSendCommand(`MAIL FROM:<${gmailUser}>`);
    await tlsSendCommand(`RCPT TO:<${to}>`);
    await tlsSendCommand("DATA");

    const emailContent = [
      `From: АвтоДом <${gmailUser}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlBody,
      `.`,
    ].join("\r\n");

    await tlsSendCommand(emailContent);
    console.log('Email content sent');
    
    await tlsSendCommand("QUIT");
    console.log('SMTP session closed');

    tlsConn.close();
  } catch (error) {
    console.error('SMTP error:', error);
    if (conn) {
      try {
        conn.close();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('Email request received');
    const { to, firstName, lastName, packageName, packagePrice, positions, orderId, transactionNumber, siteUrl }: EmailRequest = await req.json();

    console.log('Email details:', { to, firstName, lastName, packageName, positions: positions.length });

    const gmailUser = 'pavlo.bogdan.1307@gmail.com';
    const gmailPassword = 'auve apuy qmjx nyyj';

    const stickerUrl = 'https://avto-domkiev.com/avtodom_sticker.png';

   const emailBody = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #eee; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .sticker-section { text-align: center; margin: 30px 0; }
        .positions { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 18px; font-weight: bold; color: #f97316; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        img.sticker { max-width: 250px; display: block; margin: 0 auto; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Дякуємо за замовлення!</h1>
        </div>
        <div class="content">
          <p>Вітаємо, <strong>${firstName} ${lastName}</strong>!</p>
          <p>Ваше замовлення успішно оплачено.</p>

          <div class="sticker-section">
            <p style="font-weight: bold;">Твоя ексклюзивна наліпка:</p>
            <img class="sticker" src="${stickerUrl || 'https://avto-domkiev.com/avtodom_sticker.png'}" alt="Твоя ексклюзивна наліпка" />
          </div>

          <h3>Деталі замовлення:</h3>
          <ul>
            <li><strong>Товар:</strong> ${packageName}</li>
            <li><strong>Ціна:</strong> ${packagePrice} грн</li>
            <li><strong>Кількість цифрових наклейок (50 px):</strong> ${positions.length}</li>
            <li><strong>ID замовлення:</strong> ${orderId}</li>
            ${transactionNumber ? `<li><strong>Номер транзакції:</strong> ${transactionNumber}</li>` : ''}
          </ul>

          <div class="positions">
            <div>Ваші позиції в акції:</div>
            <div style="margin-top: 10px;">${positions.map(p => '#' + p).join(', ')}</div>
          </div>

          <p>Дякуємо за участь в акції!</p>
          <p style="margin-top: 30px;">З повагою,<br><strong>Команда АвтоДом</strong></p>
        </div>
        <div class="footer">
          <p>Це автоматичне повідомлення, будь ласка, не відповідайте на нього.</p>
        </div>
      </div>
    </body>
  </html>
`;

    console.log('Attempting to send email...');
    await sendEmailViaGmail(
      to,
      'Підтвердження замовлення - АвтоДом Акція',
      emailBody,
      gmailUser,
      gmailPassword
    );

    console.log('Email sent successfully to:', to);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error stack:', error.stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
});