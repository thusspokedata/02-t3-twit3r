import Image from "next/image";
import { RouterOutputs, trpc } from "../utils/trpc";
import { CreateTweet } from "./CreateTweet";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocal from "dayjs/plugin/updateLocale";
import { useEffect, useState } from "react";

import { AiFillHeart } from "react-icons/ai";

dayjs.extend(relativeTime);
dayjs.extend(updateLocal);

dayjs.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "1s",
    m: "1m",
    mm: "%dm",
    h: "1h",
    hh: "%dh",
    d: "1d",
    dd: "%dh",
    M: "1M",
    MM: "%dM",
    y: "1y",
    yy: "%dy",
  },
});

function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState(0);

  function handleScroll() {
    const height =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;

    const winScroll =
      document.body.scrollTop || document.documentElement.scrollTop;

    const scrolled = (winScroll / height) * 100;

    setScrollPosition(scrolled);
  }
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return scrollPosition;
}

function Tweet({
  tweet,
}: {
  tweet: RouterOutputs["tweet"]["timeline"]["tweets"][number];
}) {

    const likeMutation = trpc.tweet.like.useMutation().mutateAsync;
    const unlikeMutation = trpc.tweet.unlike.useMutation().mutateAsync;

    const hasLiked = tweet.likes.length > 0;

  return (
    <div className="mb-4 border-b-2 border-gray-500">
      <div className="flex p-2">
        {tweet.author.image && (
          <Image
            src={tweet.author.image}
            alt={`${tweet.author.name} profile 
                picture`}
            width={48}
            height={48}
            className="rounded-full"
          />
        )}
        <div className="ml-2">
          <div className="flex items-center">
            <p className="font-bold">{tweet.author.name}</p>
            <p className="text-sm text-gray-400">
              {" "}
              - {dayjs(tweet.createdAt).fromNow()}
            </p>
          </div>
          <div>{tweet.text}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center p-2">
        <AiFillHeart
          color={hasLiked ? "red" : "gray"}
          size="1.5rem"
          onClick={() => {
            if (hasLiked) {
              unlikeMutation({
                tweetId: tweet.id,
              });
              return;
            }
            likeMutation({
                tweetId: tweet.id,
            });
        }}
        />

        <span className="text-sm text-gray-500">{10}</span>
      </div>
    </div>
  );
}

export function Timeline() {
  const scrollPosition = useScrollPosition();

  const { data, hasNextPage, fetchNextPage, isFetching } =
    trpc.tweet.timeline.useInfiniteQuery(
      {
        limit: 10,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  console.log("data", data);

  const tweets = data?.pages.flatMap((page) => page.tweets) ?? [];

  useEffect(() => {
    if (scrollPosition > 90 && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [scrollPosition, hasNextPage, isFetching, fetchNextPage]);

  console.log("tweets", tweets)
  return (
    <div>
      <CreateTweet />
      <div className="border-l-2 border-r-2 border-t-2 border-gray-500">
        {tweets.map((tweet) => {
          return <Tweet key={tweet.id} tweet={tweet} />;
        })}

        {!hasNextPage && <p>No more items to load</p>}

        {/* <button onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetching}>
                    load next
                </button> */}
      </div>
    </div>
  );
}
