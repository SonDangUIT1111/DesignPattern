import prisma from "@/lib/prisma";
import connectMongoDB from "@/lib/mongodb";

export async function GET(req: Request) {
    try {
        await connectMongoDB();
        const url = new URL(req.url);
        const searchParams = new URLSearchParams(url.search);
        const userId = searchParams.get('id');
        
        console.log("API /user - Requested userId:", userId);
        
        if (!userId) {
            console.log("API /user - No userId provided");
            return new Response(JSON.stringify({ message: 'userId is required' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const user = await prisma.users.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                avatar: true,
                phone: true,
                coinPoint: true,
                username: true,
                questLog: true,
            }
        });

        console.log("API /user - Found user:", user);

        if (!user) {
            console.log("API /user - User not found for ID:", userId);
            return new Response(JSON.stringify({ message: 'user not found' }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log("API /user - Returning user data:", user);
        return new Response(JSON.stringify(user), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("API /user - Error:", error);
        return new Response(JSON.stringify({ message: 'Internal server error', error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}