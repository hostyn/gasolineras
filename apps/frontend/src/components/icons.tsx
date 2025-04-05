interface IconProps {
  className?: string;
}

type Icon = React.FC<IconProps>;

export const ChevronDownIcon: Icon = ({ ...props }) => (
  <svg viewBox="0 -960 960 960" {...props}>
    <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
  </svg>
);

export const StarIcon: Icon = ({ ...props }) => (
  <svg viewBox="0 -960 960 960" {...props}>
    <path d="m233-120 65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Z" />
  </svg>
);
