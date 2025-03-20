package lk.ijse.backend.util;

import lombok.extern.slf4j.Slf4j;

import javax.mail.*;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import java.util.Properties;

@Slf4j
public class EmailSender {
    public boolean sendEmail(String recipientEmail, String emailTitle, String emailContent) {
        log.info("Sending email to: {}", recipientEmail);
        // Sender's email and password
        final String senderEmail = "sahanlearnersofficial@gmail.com";
        final String password = "rkxx hlyu mevg riti";

        // Setup mail server properties
        Properties properties = new Properties();
        properties.put("mail.smtp.host", "smtp.gmail.com");
        properties.put("mail.smtp.port", "465");
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.socketFactory.port", "465");
        properties.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");

        // Get the Session object
        Session session = Session.getInstance(properties, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(senderEmail, password);
            }
        });

        session.setDebug(false);

        try {
            // Create a MimeMessage object
            Message message = new MimeMessage(session);

            // Set the sender and recipient addresses
            message.setFrom(new InternetAddress(senderEmail));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(recipientEmail));

            // Set email subject
            message.setSubject(emailTitle);

            // Set email content
            message.setText(emailContent);

            // Send the message
            Transport.send(message);
            return true;

        } catch (MessagingException e) {
            log.error("Failed to send email: {}", e.getMessage());
            return false;
        }
    }
}
