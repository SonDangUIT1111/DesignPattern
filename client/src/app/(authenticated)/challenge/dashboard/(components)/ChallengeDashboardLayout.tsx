"use client";

import React, { useEffect } from 'react'
import { Trophy, Home, Book, Film, Star, User, Hourglass } from 'lucide-react'

import { Card, CardContent } from "@/components/ui/card"
import DailyMission from './DailyMission';
import Leaderboard from './Leaderboard';
import { useChallenge } from '@/hooks/useChallenge';
import { useQuest } from '@/hooks/useQuest';
import { useQuery } from '@tanstack/react-query';
import Loader from '@/components/Loader';
import DailyQuest from './DailyQuest';
import { useUser } from '@/hooks/useUser';
import { useRouter } from "next/navigation";


const ChallengeDashboardLayout = ({ session }) => {

    const { getUsersChallengesPoint, getChallengeInformation } = useChallenge();
    const { updateLoginLog, getDailyQuests, updateQuestLog } = useQuest();
    const [currentDateTime, setCurrentDateTime] = React.useState(new Date());
    const { getUserCoinAndChallenge } = useUser();
    const router = useRouter();

    const { data: userCoinAndQCData, isLoading: isUserCoinAndQCDataLoading, refetch: refetchUserCoinAndQCData } = useQuery({
        queryKey: ['user', 'coinAndQCData', session?.user?.id],
        queryFn: async () => {
            const res = await getUserCoinAndChallenge(session?.user?.id);
            return res;
        },
    });

    const { data: challengePoints, isLoading } = useQuery({
        queryKey: ['challenge', 'points'],
        queryFn: async () => {
            const res = await getUsersChallengesPoint();
            console.log(res);
            return res;
        },
    })

    const { data: dailyQuests, isLoading: isDailyQuestsLoading } = useQuery({
        queryKey: ['daily', 'quests'],
        queryFn: async () => {
            const res = await getDailyQuests();
            console.log(res);
            return res;
        },
    });

    const { data: challengeInformation, isLoading: isChallengeInformationLoading } = useQuery({
        queryKey: ['challenge', 'information'],
        queryFn: async () => {
            const res = await getChallengeInformation();
            console.log(res);
            return res;
        },
    })


    useEffect(() => {
        const fetchDateTime = async () => {
            try {
                const response = await fetch('http://worldtimeapi.org/api/timezone/Asia/Ho_Chi_Minh');
                const data = await response.json();
                console.log(data.datetime);
                setCurrentDateTime(new Date(data.datetime));
            } catch (error) {
                console.error('Error fetching date and time:', error);
            }
        };
        console.log(session);
        fetchDateTime();
    }, []);



    if (isLoading || isDailyQuestsLoading || isUserCoinAndQCDataLoading || isChallengeInformationLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader />
            </div>
        )
    }

    return (
        <div className='w-full min-h-screen'>
            <div className="min-h-screen text-white">
                <div className="max-w-7xl mx-auto p-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Challenge Info, Podium, and Results (on top for smaller screens) */}
                        <div className="w-full lg:w-1/2 space-y-8 order-1 lg:order-2">
                            {/* Header */}
                            <div className="flex flex-col text-center lg:text-left">
                                <h1 className="text-3xl font-bold mb-2">Thử thách</h1>
                                <p className="text-purple-400 text-lg">{challengeInformation?.challengeName}</p>
                                {challengeInformation?.endTime && (
                                    <div className="flex items-center justify-center lg:justify-start">
                                        {currentDateTime < new Date(challengeInformation.endTime) ? (
                                            <p className="text-purple-400 text-lg flex flex-row">
                                                <Hourglass className="mr-1 w-6 h-6" />
                                                Thời gian còn lại: {Math.max(0, Math.floor((new Date(challengeInformation.endTime).getTime() - currentDateTime.getTime()) / (1000 * 60 * 60 * 24)))} ngày {Math.max(0, Math.floor((new Date(challengeInformation.endTime).getTime() - currentDateTime.getTime()) / (1000 * 60 * 60)) % 24)} giờ {Math.max(0, Math.floor((new Date(challengeInformation.endTime).getTime() - currentDateTime.getTime()) / (1000 * 60)) % 60)} phút
                                            </p>
                                        ) : (
                                            <p className="text-red-400 text-lg flex flex-row">
                                                <Hourglass className="mr-1 w-6 h-6" />
                                                Thời gian thử thách đã kết thúc
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Leaderboard challengePoints={challengePoints} />

                            {/* Challenge Results */}
                            <Card className="bg-gray-800 border-purple-500 border">
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-semibold mb-4 text-purple-300">Kết quả thử thách:</h2>
                                    <p className="text-4xl font-bold text-purple-400">
                                        {challengePoints?.find(user => user.userId === session?.user?.id)?.point.reduce((acc, curr) => acc + curr.point, 0) || 0} điểm
                                    </p>
                                </CardContent>
                            </Card>
                            {challengePoints?.find(user => user.userId === session?.user?.id)?.point.length === 0 && (
                                <div className="flex justify-center mt-4">
                                    <button
                                        className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-700"
                                        onClick={() => router.push("/challenge/ingame")}
                                    >
                                        THAM GIA NGAY
                                    </button>
                                </div>
                            )}


                        </div>

                        <div className="w-full lg:w-1/2 space-y-8 order-2 lg:order-1">
                            <DailyMission
                                currentDateTime={currentDateTime}
                                hasReceivedDailyGift={userCoinAndQCData?.questLog?.hasReceivedDailyGift}
                                updateLoginLog={updateLoginLog}
                                userId={session?.user?.id}
                                refetchUserCoinAndQCData={refetchUserCoinAndQCData}
                            />

                            <DailyQuest dailyQuests={dailyQuests}
                                questLog={userCoinAndQCData?.questLog}
                                updateQuestLog={updateQuestLog}
                                userId={session?.user?.id}
                                refetchUserCoinAndQCData={refetchUserCoinAndQCData} />

                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default ChallengeDashboardLayout