import { useId, useState, type ReactNode } from 'react';

type CollapsibleSectionProps = {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export const CollapsibleSection = ({
  label,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionId = useId();
  return (
    <div className="rp-section">
      <button
        type="button"
        className="rp-section-header"
        aria-expanded={isOpen}
        aria-controls={sectionId}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className="rp-section-label">{label}</span>
        <span
          aria-hidden="true"
          className={`rp-section-chevron ${isOpen ? 'open' : ''}`}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div id={sectionId} className="rp-section-content">
          {children}
        </div>
      )}
    </div>
  );
};
