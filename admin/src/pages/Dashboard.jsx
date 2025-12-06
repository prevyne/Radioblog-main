import React, { useEffect, useState } from "react";
import { useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { toast, Toaster } from "sonner";
import clsx from "clsx";

// Components
import Stats from "../components/Stats";
import Graph from "../components/Graph";
import { RecentFollowerTable, RecentPostTable } from "../components/Table";
import Loading from "../components/Loading";

// Store & API
import useStore from "../store";
import { getAdminStats } from "../utils/apiCalls";

const Dashboard = () => {
  const { colorScheme } = useMantineColorScheme();
  const { user } = useStore();
  const theme = colorScheme === "dark";

  // State for data and loading
  const [data, setData] = useState(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsPending(true);
      try {
        // Pass the user token if backend requires auth
        const statsData = await getAdminStats(user?.token);
        setData(statsData);
      } catch (error) {
        console.error("Failed to load stats", error);
        toast.error("Could not load dashboard data.");
      } finally {
        setIsPending(false);
      }
    };

    fetchStats();
  }, [user?.token]); // Re-run if user token changes

  return (
    <div className='w-full'>
      {/* 1. Top Stats Cards */}
      <Stats dt={data} />

      {/* 2. Graph Section */}
      <div className='w-full py-8'>
        <p className='py-5 text-base font-medium'>
          View Stats for last 28 days
        </p>
        <Graph dt={data?.viewStats} />
      </div>

      {/* 3. Tables Section */}
      <div className='flex gap-6 flex-col md:flex-row py-6'>
        {/* Recent Followers */}
        <div className='w-full md:w-1/3 flex flex-col'>
          <span
            className={clsx(
              "py-5 text-base font-medium",
              theme ? "text-white" : "text-slate-600"
            )}
          >
            Recent Followers
          </span>
          <RecentFollowerTable data={data?.last5Followers} theme={theme} />
        </div>

        {/* Recent Content */}
        <div className='w-full md:w-2/3 flex flex-col'>
          <span
            className={clsx(
              "py-5 text-base font-medium",
              theme ? "text-white" : "text-slate-600"
            )}
          >
            Recent 5 Content
          </span>
          <RecentPostTable data={data?.last5Posts} theme={theme} />
        </div>
      </div>

      {/* 4. Loading Overlay & Toasts */}
      <Loading visible={isPending} />
      <Toaster richColors />
    </div>
  );
};

export default Dashboard;