const nodemailer = require("nodemailer");
import { convert } from "html-to-text";
import ejs from "ejs";

import { UserDocument } from "./../models/userModel";

class Email {
  public firstName: string = "";
  public from: string = "";
  public to: string = "";
  public url: string = "";

  constructor(user: UserDocument, url: string) {
    this.firstName = user.name.split(" ")[0];
    this.from = `Sanjay Khatri <${process.env.EMAIL_FROM}>`;
    this.to = user.email;
    this.url = url;
  }

  initiateTransport(): any {
    if (process.env.NODE_ENV === "production") {
      return 1;
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(template: any, subject: string) {
    // Render HTML based on a pug template
    const html: any = await ejs.renderFile(
      `${__dirname}/../views/pages/email/${template}.ejs`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    // Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    // Create transport and send email
    await this.initiateTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.sendEmail("welcome", "Welcome to blog corner");
  }

  async sendResetPassword() {
    await this.sendEmail(
      "resetPassword",
      "Your password reset token (valid for only 10mins)"
    );
  }
}

export default Email;
