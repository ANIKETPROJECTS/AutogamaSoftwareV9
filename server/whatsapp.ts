import { WhatsAppTemplate, type JobStage } from './models';

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!phoneNumberId || !accessToken) {
    console.log(`[WhatsApp] API not configured. Message: ${phone}: ${message}`);
    return false;
  }
  
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone.replace(/[^0-9]/g, ''),
        type: 'text',
        text: { body: message }
      })
    });
    
    if (response.ok) {
      console.log(`[WhatsApp] Message sent to ${phone}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`[WhatsApp] Failed to send message: ${error}`);
      return false;
    }
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error);
    return false;
  }
}

export async function sendStageUpdateMessage(phone: string, stage: JobStage, vehicleName: string, plateNumber: string): Promise<boolean> {
  try {
    const template = await WhatsAppTemplate.findOne({ stage, isActive: true });
    
    if (!template) {
      console.log(`[WhatsApp] No active template found for stage: ${stage}`);
      return false;
    }

    const message = template.message
      .replace(/\{\{vehicle\}\}/g, vehicleName)
      .replace(/\{\{plate\}\}/g, plateNumber)
      .replace(/\{\{stage\}\}/g, stage);

    return sendWhatsAppMessage(phone, message);
  } catch (error) {
    console.error('[WhatsApp] Error sending stage update:', error);
    return false;
  }
}

export async function initializeWhatsAppTemplates(): Promise<void> {
  const defaultTemplates = [
    { stage: 'New Lead' as JobStage, message: 'Welcome! Your {{vehicle}} ({{plate}}) has been registered. We will contact you shortly.' },
    { stage: 'Inspection Done' as JobStage, message: 'Inspection completed for your {{vehicle}} ({{plate}}). Our team will share the report soon.' },
    { stage: 'Work In Progress' as JobStage, message: 'Work has started on your {{vehicle}} ({{plate}}). We will keep you updated.' },
    { stage: 'Completed' as JobStage, message: 'Your {{vehicle}} ({{plate}}) service is now complete. Thank you for choosing AutoGarage!' },
    { stage: 'Cancelled' as JobStage, message: 'Your {{vehicle}} ({{plate}}) service has been cancelled. Please contact us for more details.' }
  ];

  // Remove any old stages that are not in the current job stages
  const currentStages = defaultTemplates.map(t => t.stage);
  await WhatsAppTemplate.deleteMany({ stage: { $nin: currentStages } });

  for (const template of defaultTemplates) {
    await WhatsAppTemplate.findOneAndUpdate(
      { stage: template.stage },
      template,
      { upsert: true }
    );
  }
  
  console.log('[WhatsApp] Templates initialized');
}
