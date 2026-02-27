import Image from "next/image";

/**
 * Transaction Partner AG logo — uses the official brand image.
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
        <Image
            src="/tp-logo.png"
            alt="Transaction Partner"
            width={width}
            height={height}
            className={className}
            priority
            style={{ objectFit: "contain" }}
        />
    );
}
