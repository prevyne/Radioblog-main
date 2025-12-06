import React from "react";
import { Group, Paper, SimpleGrid, Text } from "@mantine/core";
import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react";
import { BsEye, BsPostcardHeart } from "react-icons/bs";
import { FaUsers, FaUsersCog } from "react-icons/fa";
import { formatNumber } from "../utils"; // Ensure this exists in utils/index.js

const icons = {
  user: FaUsersCog,
  view: BsEye,
  post: BsPostcardHeart,
  users: FaUsers,
};

const Stats = ({ dt }) => {
  const data = [
    {
      title: "TOTAL POSTS",
      icon: "post",
      value: formatNumber(dt?.totalPosts ?? 0),
      diff: dt?.postsDiff ?? 0, // Uses real diff if available, else 0
    },
    {
      title: "FOLLOWERS",
      icon: "users",
      value: formatNumber(dt?.followers ?? 0),
      diff: dt?.followersDiff ?? 0,
    },
    {
      title: "TOTAL VIEWS",
      icon: "view",
      value: formatNumber(dt?.totalViews ?? 0),
      diff: dt?.viewsDiff ?? 0,
    },
    {
      title: "TOTAL WRITERS",
      icon: "user",
      value: formatNumber(dt?.totalWriters ?? 0),
      diff: dt?.writersDiff ?? 0,
    },
  ];

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
      {data.map((stat) => {
        const Icon = icons[stat.icon];
        const DiffIcon = stat.diff >= 0 ? IconArrowUpRight : IconArrowDownRight;
        const diffColor = stat.diff >= 0 ? "teal" : "red";

        return (
          <Paper withBorder p="md" radius="md" key={stat.title}>
            <Group justify="space-between">
              <Text size="xs" c="dimmed" className="uppercase font-bold">
                {stat.title}
              </Text>
              <Icon size="1.4rem" className="text-gray-500" />
            </Group>

            <Group align="flex-end" gap="xs" mt={25}>
              <Text className="text-2xl font-bold">{stat.value}</Text>
              
              <Text c={diffColor} fz="sm" fw={500} className="flex items-center">
                <span>{stat.diff}%</span>
                <DiffIcon size="1rem" stroke={1.5} />
              </Text>
            </Group>

            <Text fz="xs" c="dimmed" mt={7}>
              Compared to previous month
            </Text>
          </Paper>
        );
      })}
    </SimpleGrid>
  );
};

export default Stats;