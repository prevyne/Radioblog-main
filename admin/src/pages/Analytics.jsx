import React, { useEffect, useState } from "react";
import { useMantineColorScheme } from "@mantine/core";
import { toast, Toaster } from "sonner";
import Stats from "../components/Stats";
import Graph from "../components/Graph";
import Loading from "../components/Loading";
import useStore from "../store";
import { getAdminStats } from "../utils/apiCalls";

const Analytics = () => {
  const { colorScheme } = useMantineColorScheme();
  const theme = colorScheme === "dark";
  const { user } = useStore();

  const [data, setData] = useState(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsPending(true);
      try {
        const statsData = await getAdminStats(user?.token);
        setData(statsData);
      } catch (error) {
        console.error("Error loading analytics:", error);
        toast.error("Could not load analytics data.");
      } finally {
        setIsPending(false);
      }
    };

    fetchStats();
  }, [user?.token]);

  return (
    <div className='w-full'>
      <div className='flex flex-col gap-6 mb-8'>
        <h1 className='text-2xl font-bold text-slate-600 dark:text-slate-200'>
          Analytics
        </h1>
        
        {/* Render the Stats Cards */}
        <Stats dt={data} />
      </div>

      <div className='w-full py-8'>
        <p className='py-5 text-base font-medium text-slate-600 dark:text-slate-200'>
          View Stats for last 28 days
        </p>
        
        {/* Render the Graph */}
        <Graph dt={data?.viewStats} />
      </div>

      <Loading visible={isPending} />
      <Toaster richColors />
    </div>
  );
};

export default Analytics;