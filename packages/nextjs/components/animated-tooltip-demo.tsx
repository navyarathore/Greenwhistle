"use client";

import { AnimatedTooltip } from "./ui/animated-tooltip";

const people = [
  {
    id: 1,
    name: "Vaibhav Kothari",
    designation: "FullStack Engineer",
    image: "/vaibhav.png",
  },
  {
    id: 2,
    name: "Abhigya Krishna",
    designation: "Blockchain Developer",
    image: "/abhigya.jpg",
  },
  {
    id: 3,
    name: "Navya Rathore",
    designation: "AI Engineer",
    image: "/navya.png",
  },
];

export default function AnimatedTooltipPreview() {
  return (
    <div className="flex flex-row items-center justify-center mb-10 w-full">
      <AnimatedTooltip items={people} />
    </div>
  );
}
