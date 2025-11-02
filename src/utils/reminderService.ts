import { supabase } from '../lib/supabase';

export const sendReminderEmails = async () => {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-reminder-emails`;
    
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending reminder emails:', error);
    throw error;
  }
};

export const checkForUpcomingInstallations = () => {
  // This could be called periodically or on app startup
  // In a production app, you might want to set up a cron job or scheduled task
  sendReminderEmails()
    .then(result => {
      console.log('Reminder check completed:', result);
    })
    .catch(error => {
      console.error('Reminder check failed:', error);
    });
};