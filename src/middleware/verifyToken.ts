import { verifyToken } from '@clerk/clerk-sdk-node';

const verifyClerkToken = async (token: string) => {
    try {
        const verifiedToken = await verifyToken(token, {
            jwtKey: process.env.CLERK_JWT_KEY,
            secretKey: process.env.CLERK_SECRET_KEY,
        });

        const { exp, nbf } = verifiedToken;

        // Check if the token is expired or not yet valid
        const currentTime = Math.floor(Date.now() / 1000);
        if (exp < currentTime || nbf > currentTime) {
            return false;
        }

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export default verifyClerkToken;
