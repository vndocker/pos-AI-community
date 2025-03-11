import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Dict, Any, Union
import logging

logger = logging.getLogger(__name__)

class EmailSender:
    """
    Email sender utility using smtplib.SMTP.
    Supports configuration for different SMTP providers like Mailtrap or custom SMTP servers.
    """
    
    def __init__(
        self,
        smtp_server: Optional[str] = None,
        smtp_port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        sender_email: Optional[str] = None,
        use_tls: bool = True
    ):
        """
        Initialize the email sender with SMTP configuration.
        
        Args:
            smtp_server: SMTP server address
            smtp_port: SMTP server port
            username: SMTP username
            password: SMTP password
            sender_email: Default sender email address
            use_tls: Whether to use TLS for connection
        """
        # Use provided values or fall back to environment variables
        self.smtp_server = smtp_server or os.getenv("SMTP_SERVER", "smtp.bizflycloud.vn")
        self.smtp_port = smtp_port or int(os.getenv("SMTP_PORT", "587"))
        self.username = username or os.getenv("SMTP_USER", "pos@nebu.vn")
        self.password = password or os.getenv("SMTP_PASSWORD", "password")
        self.sender_email = sender_email or os.getenv("MAIL_FROM", "pos@nebu.vn")
        self.use_tls = use_tls
    
    def send_email(
        self,
        recipients: Union[str, List[str]],
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        sender: Optional[str] = None
    ) -> bool:
        """
        Send an email using the configured SMTP server.
        
        Args:
            recipients: Email recipient(s)
            subject: Email subject
            body: Plain text email body
            html_body: HTML email body (optional)
            cc: Carbon copy recipients (optional)
            bcc: Blind carbon copy recipients (optional)
            attachments: List of attachment dictionaries (optional)
            sender: Override the default sender email (optional)
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        if isinstance(recipients, str):
            recipients = [recipients]
            
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = sender or self.sender_email
        msg['To'] = ', '.join(recipients)
        
        if cc:
            msg['Cc'] = ', '.join(cc)
            recipients.extend(cc)
            
        if bcc:
            recipients.extend(bcc)
        
        # Add plain text body
        msg.attach(MIMEText(body, 'plain'))
        
        # Add HTML body if provided
        if html_body:
            msg.attach(MIMEText(html_body, 'html'))
        
        # TODO: Add attachment handling if needed in the future
        
        try:
            # Connect to SMTP server
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.ehlo()
                if self.use_tls:
                    server.starttls()
                    server.ehlo()
                
                # Login if credentials are provided
                if self.username and self.password:
                    server.login(self.username, self.password)
                
                # Send email
                server.sendmail(
                    self.sender_email,
                    recipients,
                    msg.as_string()
                )
                
            logger.info(f"Email sent successfully to {', '.join(recipients)}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

# Factory functions for common configurations

def get_default_email_sender() -> EmailSender:
    """
    Get an email sender with default configuration from environment variables.
    
    Returns:
        EmailSender: Configured email sender instance
    """
    return EmailSender()

def get_mailtrap_email_sender() -> EmailSender:
    """
    Get an email sender configured for Mailtrap.
    
    Returns:
        EmailSender: Mailtrap-configured email sender instance
    """
    return EmailSender(
        smtp_server=os.getenv("MAIL_SERVER", "sandbox.smtp.mailtrap.io"),
        smtp_port=int(os.getenv("MAIL_PORT", "2525")),
        username=os.getenv("MAIL_USERNAME", "5ba47113c06e1a"),
        password=os.getenv("MAIL_PASSWORD", "384f0582383c70"),
        sender_email=os.getenv("MAIL_FROM", "pos@nebu.vn")
    )

def get_bizflycloud_email_sender() -> EmailSender:
    """
    Get an email sender configured for BizflyCloud.
    
    Returns:
        EmailSender: BizflyCloud-configured email sender instance
    """
    return EmailSender(
        smtp_server="smtp.bizflycloud.vn",
        smtp_port=587,
        username=os.getenv("SMTP_USER", "pos@somedomain.com"),
        password=os.getenv("SMTP_PASSWORD", "password"),
        sender_email="pos@nebu.vn"
    ) 