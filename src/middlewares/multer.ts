import * as multer from "multer";
import { FileFilterCallback } from "multer";
import { Request } from "express";

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "video/mp4" ||
    file.mimetype === "video/avi" ||
    file.mimetype === "video/mkv"
  ) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

const fileStore = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    callback: DestinationCallback
  ) => {
    callback(null, `${__dirname}/../../public/uploads/`);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    callback: FileNameCallback
  ) => {
    callback(null, `${Date.now()}-${file.originalname}`);
  },
});

const creativesStore = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    callback: DestinationCallback
  ) => {
    callback(null, `${__dirname}/../../public/uploads/creatives/`);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    callback: FileNameCallback
  ) => {
    callback(null, `${Date.now()}-${file.originalname}`);
  },
});

export const ImageUpload = multer({
  storage: fileStore,
  fileFilter: imageFilter,
});

export const CreativeUpload = multer({
  storage: creativesStore,
  fileFilter: imageFilter,
});
