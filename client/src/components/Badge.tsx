interface BadgeProps {
    status: string;
}

const Badge = ({ status }: BadgeProps) => {
    return <span className={`badge badge-${status}`}>{status}</span>;
};

export default Badge;
