/**
 * Transaction Partner AG logo — recreated as an inline SVG
 * so it renders crisply at any size and inherits currentColor.
 */
export default function TransactionPartnerLogo({
    className = "",
    height = 32,
}: {
    className?: string;
    height?: number;
}) {
    // The logo is roughly 4.8:1 aspect ratio
    const width = Math.round(height * 4.8);

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 288 60"
            width={width}
            height={height}
            className={className}
            aria-label="Transaction Partner"
            role="img"
        >
            {/* TP monogram */}
            <text
                x="0"
                y="46"
                fontFamily="'Playfair Display', 'Georgia', serif"
                fontSize="48"
                fontWeight="400"
                fill="currentColor"
                letterSpacing="-1"
            >
                T P
            </text>

            {/* Vertical divider */}
            <line
                x1="68"
                y1="8"
                x2="68"
                y2="52"
                stroke="currentColor"
                strokeWidth="1.5"
            />

            {/* TRANSACTION */}
            <text
                x="80"
                y="28"
                fontFamily="'Inter', 'Helvetica Neue', sans-serif"
                fontSize="18"
                fontWeight="600"
                fill="currentColor"
                letterSpacing="3.5"
            >
                TRANSACTION
            </text>

            {/* PARTNER */}
            <text
                x="80"
                y="50"
                fontFamily="'Inter', 'Helvetica Neue', sans-serif"
                fontSize="18"
                fontWeight="600"
                fill="currentColor"
                letterSpacing="3.5"
            >
                PARTNER
            </text>
        </svg>
    );
}
