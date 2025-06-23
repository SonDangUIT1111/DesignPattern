"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Timer, ArrowRight, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useChallenge } from "@/hooks/useChallenge";
import { useQuery } from "@tanstack/react-query";
import Loader from "@/components/Loader";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@nextui-org/modal";
import { ReceivedCoinDialog } from "@/components/receivedCoinDialog";
import { ConcreateQuestionCollection } from "./ConcreateCollection";
import { Question } from "./question";
import { ConcreateQuestionIterator } from "./ConcreateIterator";

const IngameLayout = ({ session }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number | null>
  >({});
  const [iterator, setIterator] = useState<ConcreateQuestionIterator | null>(
    null
  );
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [score, setScore] = useState<number | null>(null);
  const [message, setMessage] = React.useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();

  const {
    getChallengeInformation,
    uploadChallengesPoint,
    getUsersChallengesPoint,
  } = useChallenge();

  const { data: challengeInformation, isLoading } = useQuery({
    queryKey: ["challenge", "information"],
    queryFn: getChallengeInformation,
  });

  const { data: userChallengesPoint } = useQuery({
    queryKey: ["challenge", "userChallengesPoint"],
    queryFn: getUsersChallengesPoint,
  });

  useEffect(() => {
    if (userChallengesPoint) {
      const challengePoint = (userChallengesPoint || []).find(
        (point) => point.userId === session?.user?.id
      );
      if (challengePoint && challengePoint.point.length > 0) {
        setScore(challengePoint.point);
        console.log(challengePoint);
        toast.error("Bạn đã hoàn thành thử thách này rồi");
        router.push("/challenge/dashboard");
      }
    }
  }, [userChallengesPoint]);

  const questionList = challengeInformation?.questionCollection || [];

  useEffect(() => {
    if (challengeInformation?.questionCollection?.length) {
      const qc = new ConcreateQuestionCollection();
      challengeInformation.questionCollection.forEach((q) => qc.addQuestion(q));
      const it = qc.createIterator();
      setIterator(it);
      setCurrentQuestion(it.goTo(0));
    }
  }, [challengeInformation]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleNext = () => {
    if (!iterator || !currentQuestion) return;
    if (iterator?.hasNext()) {
      setCurrentQuestion(iterator?.next());
    } else {
      calculateScore();
    }
  };

  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      event.preventDefault();
      const data = {
        userId: session?.user?.id,
        point: 0,
        date: new Date(),
        remainingTime: timeLeft,
      };
      // await uploadChallengesPoint(data);
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [session, timeLeft, uploadChallengesPoint]);

  const calculateScore = async () => {
    let correctAnswers = 0;
    const userAnswers: string[] = [];
    const isCorrect: boolean[] = [];

    iterator?.reset();
    while (iterator?.hasNext()) {
      const question = iterator?.next();
      const userAnswerIndex = selectedAnswers[question.questionId];
      const correctAnswerIndex = question.correctAnswerID;

      if (userAnswerIndex !== null && userAnswerIndex !== undefined) {
        if (userAnswerIndex === correctAnswerIndex) {
          correctAnswers++;
          isCorrect.push(true);
        } else {
          isCorrect.push(false);
        }
        userAnswers.push(question.answers[userAnswerIndex]);
      }
    }

    const timeBonus = Math.min(Math.floor(timeLeft / 60) * 20, 1000);
    const questionPoints = correctAnswers * 100;
    const totalPoints = Math.min(questionPoints + timeBonus, 1000);

    const data = {
      userId: session?.user?.id,
      point: totalPoints,
      date: new Date(),
      remainingTime: timeLeft,
    };

    try {
      setMessage(
        `Chúc mừng bạn đã hoàn thành thử thách với ${totalPoints} điểm. Phần thưởng là ${Math.ceil(
          totalPoints / 10
        )} skycoin.`
      );
      onOpen();
      // await uploadChallengesPoint(data);

      setTimeout(() => {
        router.push("/challenge/dashboard");
      }, 5000);
    } catch {
      console.log("Error uploading challenges point");
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-[1fr_350px] gap-8">
            <main className="space-y-6">
              {/* Progress and Timer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-lg font-medium flex items-center gap-2">
                    <span>Câu hỏi:</span>
                    <span className="text-emerald-400 font-bold">
                      {(iterator?.getCurrentIndex() || 0) + 1}/
                      {questionList.length}
                    </span>
                  </div>
                  <Progress
                    value={
                      ((iterator?.getCurrentIndex() || 0) /
                        questionList.length) *
                      100
                    }
                    className="w-full sm:w-48 h-2 bg-zinc-800"
                  />
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-zinc-800/50 rounded-full">
                  <Timer className="w-5 h-5 text-emerald-400" />
                  <span className="font-mono text-lg">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* Question Card */}
              {currentQuestion && (
                <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
                  <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={currentQuestion.mediaUrl}
                      alt="Question thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 space-y-8">
                    <div className="space-y-4">
                      <h1 className="text-2xl md:text-3xl font-bold leading-tight text-white">
                        {currentQuestion.questionName}
                      </h1>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {currentQuestion.answers.map((answer, index) => (
                        <Button
                          key={index}
                          variant="secondary"
                          className={`
                        group relative h-auto py-6 px-6
                        bg-emerald-500/10 hover:bg-emerald-500/20
                        border-2 border-transparent
                        ${
                          selectedAnswers[currentQuestion.questionId] === index
                            ? "border-emerald-500"
                            : ""
                        }
                        transition-all duration-200
                                                `}
                          onClick={() =>
                            handleAnswerSelect(
                              currentQuestion.questionId,
                              index
                            )
                          }
                        >
                          <div className="flex items-center justify-start w-full gap-3">
                            <span
                              className="
                            basis-1/44
                                w-8 h-8 rounded-full
                                bg-emerald-500/20
                                text-emerald-300
                                flex items-center justify-center text-sm
                                                    "
                            >
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="basis-3/4 text-emerald-300 text-lg">
                              {answer}
                            </span>
                          </div>
                          {selectedAnswers[currentQuestion.questionId] ===
                            index && (
                            <CheckCircle className="absolute right-4 text-emerald-400 w-5 h-5" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </main>

            {/* Sidebar */}
            <aside className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Danh sách câu hỏi</h2>
                <Button
                  className="h-[40px] w-[150px] p-2 rounded text-white text-base font-semibold mt-2 transition-colors transition-transform transition-shadow transition-all duration-500 bg-left hover:bg-right hover:shadow-[#34d399] hover:shadow-md data-[hover=true]:opacity-100"
                  style={{
                    backgroundSize: "200% auto",
                    backgroundImage:
                      "var(--button_primary_background_color, linear-gradient(90deg, #34d399, #60a5fa 50%, #34d399))",
                  }}
                  onClick={handleNext}
                  disabled={
                    selectedAnswers[iterator?.getCurrentIndex() || -1] === null
                  }
                >
                  {iterator?.getCurrentIndex() === questionList.length - 1
                    ? "Hoàn thành"
                    : "Tiếp theo"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
              {questionList.map((question, index) => (
                <Card
                  key={question.questionId}
                  className={`bg-zinc-900/50 border-zinc-800 p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer ${
                    iterator?.getCurrentIndex() === index
                      ? "border-emerald-500"
                      : ""
                  }`}
                  onClick={() =>
                    setCurrentQuestion(iterator?.goTo(index) || null)
                  }
                >
                  <div className="flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-2 line-clamp-1 text-white">
                        {question.questionName}
                      </h3>
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                        <img
                          src={question.mediaUrl}
                          alt="Related question thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </aside>
          </div>
        </div>
      </div>
      <ReceivedCoinDialog
        message={message}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable={false}
      />
    </>
  );
};

export default IngameLayout;
