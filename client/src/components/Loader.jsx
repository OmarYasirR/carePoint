/**
 * HeartbeatLoader
 * Neon heartbeat line that traces itself on a loop.
 *
 * Props:
 *  - size:      tile width in px (default 160)
 *  - tile:      show the rounded navy tile behind the line (default true)
 *  - label:     accessible label (default "Loading")
 *  - className: extra Tailwind classes for the wrapper
 *
 * Usage:
 *  <HeartbeatLoader />
 *  <HeartbeatLoader size={64} tile={false} />
 *  <div className="fixed inset-0 grid place-items-center bg-[#04213f]"><HeartbeatLoader /></div>
 */
export default function Loader({
  size = 160,
  tile = true,
  label = "Loading",
  className = "",
}) {
  return (
    <div
      role="status"
      aria-label={label}
      style={{ width: size }}
      className={`grid aspect-square place-items-center ${
        tile ? "rounded-[22%] bg-[#05264a]" : ""
      } ${className}`}
    >
      {/* Keyframes live here so no tailwind.config changes are needed */}
      <style>{`
        @keyframes hb-trace {
          0%   { stroke-dashoffset: 100; opacity: 1; }
          65%  { stroke-dashoffset: 0;   opacity: 1; }
          85%  { stroke-dashoffset: 0;   opacity: 1; }
          100% { stroke-dashoffset: 0;   opacity: 0; }
        }
      `}</style>

      <svg viewBox="0 0 340 160" aria-hidden="true" className="w-[70%] overflow-visible">
        <path
          pathLength="100"
          d="M5 90 H70 L88 52 L118 128 L145 8 L172 118 L190 68 L205 90 H335"
          className="
            fill-none stroke-[#22e6f5] stroke-[9]
            [stroke-linecap:round] [stroke-linejoin:round]
            [stroke-dasharray:100] [stroke-dashoffset:100]
            [filter:drop-shadow(0_0_5px_#22e6f5)_drop-shadow(0_0_14px_rgba(34,230,245,0.7))]
            animate-[hb-trace_1.8s_cubic-bezier(.6,.05,.4,.95)_infinite]
            motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]
          "
        />
      </svg>
    </div>
  );
}