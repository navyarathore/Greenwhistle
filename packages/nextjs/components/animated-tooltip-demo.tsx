"use client";

import { AnimatedTooltip } from "./ui/animated-tooltip";

const people = [
  {
    id: 1,
    name: "Vaibhav Kothari",
    designation: "FullStack Engineer",
    image:
      "https://media.licdn.com/dms/image/v2/D5603AQHeVQkIycTb2Q/profile-displayphoto-shrink_400_400/B56ZWkr_TqHoAg-/0/1742224750690?e=1750896000&v=beta&t=mKBNOcAhfvaMS74w1iACQ0qBey9dUtiSTbvOymRj7IM",
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
    image:
      "https://media.licdn.com/dms/image/v2/D4D03AQG-bzrFONmdZw/profile-displayphoto-shrink_400_400/B4DZZXFHy9H4Ag-/0/1745217683675?e=1750896000&v=beta&t=1LiB0ha_rvjRK2ujass-v8fe05qRQY46_44Ab6H3fEM",
  },
  {
    id: 4,
    name: "Harsh Bhai",
    designation: "Game Developer",
    image: "",
  },
];

export default function AnimatedTooltipPreview() {
  return (
    <div className="flex flex-row items-center justify-center mb-10 w-full">
      <AnimatedTooltip items={people} />
    </div>
  );
}
