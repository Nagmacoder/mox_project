const requestRejectTemplate = (status: string) => {
  // parameter for status
  const html = `
        <!DOCTYPE html>
        <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
          <meta charset="utf-8">
          <meta name="x-apple-disable-message-reformatting">
          <meta http-equiv="x-ua-compatible" content="ie=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
          <title>Template request ${status}</title>
          <link
            href="https://fonts.googleapis.com/css?family=Montserrat:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700"
            rel="stylesheet" media="screen">
          <style>
            .hover-underline:hover {
              text-decoration: underline !important;
            }
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
            @keyframes ping {
              75%,
              100% {
                transform: scale(2);
                opacity: 0;
              }
            }
            @keyframes pulse {
              50% {
                opacity: .5;
              }
            }
            @keyframes bounce {
              0%,
              100% {
                transform: translateY(-25%);
                animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
              }
              50% {
                transform: none;
                animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
              }
            }
            @media (max-width: 600px) {
              .sm-px-24 {
                padding-left: 24px !important;
                padding-right: 24px !important;
              }
              .sm-py-32 {
                padding-top: 32px !important;
                padding-bottom: 32px !important;
              }
              .sm-w-full {
                width: 100% !important;
              }
            }
          </style>
        </head>
        <body
          style="margin: 0; padding: 0; width: 100%; word-break: break-word; -webkit-font-smoothing: antialiased; --bg-opacity: 1; background-color: #eceff1;">
          <div role="article" aria-roledescription="email" aria-label="Template request Status" lang="en">
          <p style="margin: 0 0 24px;">
          Your template request was rejected by the promotion partner.
          </p>
          </div>
        </body>
        </html>
        `;
  const text = `
          Your template request was rejected by the promotion partner.`;
  return {
    html: html,
    text: text,
  };
};

export default requestRejectTemplate;
