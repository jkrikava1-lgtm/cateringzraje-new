import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { jmeno, email, telefon, 'typ-akce': typAkce, datum, 'pocet-hostu': pocetHostu, zprava } = body;

    if (!jmeno || !email || !typAkce) {
      return new Response(JSON.stringify({ error: 'Vyplňte prosím povinná pole.' }), { status: 400 });
    }

    const typLabels: Record<string, string> = {
      'firemni-akce': 'Firemní akce',
      'rodinne-oslavy': 'Rodinná oslava',
      'svatebni-hostina': 'Svatební hostina',
      'stankovy-prodej': 'Stánkový prodej / open-air',
      'jine': 'Jiné',
    };

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const html = `
      <h2>Nová poptávka — Catering z ráje</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><td style="font-weight:bold;padding-right:16px;">Jméno:</td><td>${jmeno}</td></tr>
        <tr><td style="font-weight:bold;">E-mail:</td><td><a href="mailto:${email}">${email}</a></td></tr>
        ${telefon ? `<tr><td style="font-weight:bold;">Telefon:</td><td><a href="tel:${telefon}">${telefon}</a></td></tr>` : ''}
        <tr><td style="font-weight:bold;">Typ akce:</td><td>${typLabels[typAkce] ?? typAkce}</td></tr>
        ${datum ? `<tr><td style="font-weight:bold;">Datum:</td><td>${datum}</td></tr>` : ''}
        ${pocetHostu ? `<tr><td style="font-weight:bold;">Počet hostů:</td><td>${pocetHostu}</td></tr>` : ''}
        ${zprava ? `<tr><td style="font-weight:bold;vertical-align:top;">Zpráva:</td><td>${zprava.replace(/\n/g, '<br>')}</td></tr>` : ''}
      </table>
    `;

    await transporter.sendMail({
      from: `"Catering z ráje — web" <${process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO || 'info@cateringzraje.cz',
      replyTo: email,
      subject: `Poptávka od ${jmeno} — ${typLabels[typAkce] ?? typAkce}`,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('poptavka API error:', err);
    return new Response(JSON.stringify({ error: 'Nastala chyba při odesílání. Zkuste to prosím znovu.' }), { status: 500 });
  }
};
