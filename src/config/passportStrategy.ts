import prisma from "./db";

const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const fs = require("fs");
const path = require("path");

const pathToKey = path.join(__dirname, "../secrets/", "id_rsa_pub.pem");
const PUB_KEY = fs.readFileSync(pathToKey, "utf8");

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
  algorithms: ["RS256"],
};

class JWTStrategy {
  public static init(_passport: any): any {
    _passport.use(
      new JwtStrategy(options, function (jwt_payload: any, done: Function) {
        prisma.userAccount
          .findUnique({
            where: {
              user_id: jwt_payload.sub,
            },
          })
          .then((user) => {
            if (!user) return done(null, false, { message: `User not found` });
            return done(null, user);
          })
          .catch((err) => done(err, false));
      })
    );
  }
}

export default JWTStrategy;
