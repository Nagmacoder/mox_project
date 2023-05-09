import * as nodemailer from "nodemailer";
import { MailInterface } from "../../interfaces";
import { Logger } from "../../logger";
import * as dotenv from "dotenv";
import SMTPTransport = require("nodemailer/lib/smtp-transport");

const logger = new Logger();
dotenv.config();

export default class MailService {
  private static instance: MailService;
  private transporter: nodemailer.Transporter;

  private constructor() {}

  static getInstance() {
    if (!MailService.instance) {
      MailService.instance = new MailService();
    }
    return MailService.instance;
  }

  async createConnection() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_TLS === "yes" ? true : false,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    } as SMTPTransport.Options);

    this.transporter.on("error", (error) => {
      logger.error(`Error Occured in Sending Mail -> ${error.message}`);
    });
  }

  async sendMail(
    requestId: string | number | string[],
    options: MailInterface
  ) {
    return await this.transporter
      .sendMail({
        from: `"Nikhil Upadhyay" ${process.env.SMTP_SENDER}`,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        text: options.text,
        html: options.html,
      })
      .then((info) => {
        logger.info(`${requestId} - Mail Sent Successfully!!`);
        logger.info(
          `${requestId} - [MailResponse]=${info.response} [MessageID]=${info.messageId}`
        );
        return info;
      });
  }

  //VERIFY CONNECTION
  async verifyConnection() {
    return this.transporter.verify();
  }
  //CREATE TRANSPOTER
  getTransporter() {
    return this.transporter;
  }
}
