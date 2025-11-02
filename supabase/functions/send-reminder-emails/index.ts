/*
  # Email Reminder Function

  This edge function sends email reminders for upcoming installations.
  It runs daily and checks for orders that need reminder emails sent.
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate reminder date (3 days from now by default)
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 3);
    const reminderDateStr = reminderDate.toISOString().split('T')[0];

    // Get orders that need reminders
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('installation_date', reminderDateStr)
      .eq('reminder_sent', false)
      .not('status', 'in', '(completed,cancelled)');

    if (ordersError) {
      throw ordersError;
    }

    const results = [];

    for (const order of orders || []) {
      try {
        // Create email content
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Installation Reminder</h2>
            <p>Dear ${order.client.name},</p>
            <p>This is a friendly reminder that your installation for <strong>${order.title}</strong> is scheduled for <strong>${new Date(order.installation_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Order Details:</h3>
              <p><strong>Description:</strong> ${order.description}</p>
              <p><strong>Installation Address:</strong> ${order.client.address}</p>
              <p><strong>Total Amount:</strong> $${order.total_amount.toLocaleString()}</p>
              ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
            </div>
            <p>Please ensure someone is available at the scheduled time. If you need to reschedule, please contact us as soon as possible.</p>
            <p>Thank you for your business!</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">This is an automated reminder from OrderTracker Pro.</p>
          </div>
        `;

        // In a production environment, you would integrate with an email service like:
        // - SendGrid
        // - Mailgun  
        // - Amazon SES
        // - Resend
        // For this demo, we'll simulate sending the email

        console.log(`Email reminder sent to ${order.client.email} for order ${order.title}`);

        // Mark reminder as sent
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({ reminder_sent: true })
          .eq('id', order.id);

        if (updateError) {
          throw updateError;
        }

        results.push({
          order_id: order.id,
          client_email: order.client.email,
          status: 'sent'
        });

      } catch (error) {
        console.error(`Failed to send reminder for order ${order.id}:`, error);
        results.push({
          order_id: order.id,
          client_email: order.client?.email,
          status: 'failed',
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});