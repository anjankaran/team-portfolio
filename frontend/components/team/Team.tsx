"use client";

import { useRef, useState } from "react";
import { T } from "@/lib/theme";
import { TEAM, type TeamMember } from "@/data/team";
import { SectionWrap } from "@/components/shared/SectionWrap";
import { Eyebrow } from "@/components/shared/Eyebrow";
import { Reveal } from "@/components/shared/Reveal";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type MotionValue,
} from "framer-motion";
import {
  Database, Cpu, Brain, Bot, Wrench, Code2, GitBranch, Zap,
  Monitor, Layout, CodeXml, Server, HardDrive, Link, Settings, Package,
  Smartphone, Globe, Rocket,
} from "lucide-react";

const PRITAM_ICONS = [Database, Cpu, Brain, Bot, Wrench, Code2, GitBranch, Zap];
const ANJAN_ICONS = [Monitor, Layout, CodeXml, Server, HardDrive, Link, Settings, Package];
const MANISH_ICONS = [Smartphone, Smartphone, Smartphone, Globe, Layout, Server, Link, Rocket];

const MEMBER_ICONS: Record<string, typeof PRITAM_ICONS> = {
  pritam: PRITAM_ICONS,
  anjan: ANJAN_ICONS,
  manish: MANISH_ICONS,
};

interface SkillChipProps {
  label: string;
  Icon: React.ElementType; // Fixes TypeScript red mark error
  color: string;
  isLeft: boolean;
  topPercent: number;
  progress: MotionValue<number>;
  slot: number;
  hoveredSlot: number | null;
  onHover: (slot: number | null) => void;
}

function SkillChip({
  label,
  Icon,
  color,
  isLeft,
  topPercent,
  progress,
  slot,
  hoveredSlot,
  onHover,
}: SkillChipProps) {
  // Skills reveal smoothly between 0.30 and 0.70 of scroll progress
  const start = 0.30 + slot * 0.045;
  const end = Math.min(start + 0.15, 0.75);

  const revealOpacity = useTransform(progress, [start, end], [0, 1]);
  const x = useTransform(progress, [start, end], [isLeft ? 45 : -45, 0]);
  const scale = useTransform(progress, [start, end], [0.8, 1]);
  const blur = useTransform(progress, [start, end], [6, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  // Layered on top of the scroll-reveal opacity: hovering one chip dims
  // every sibling chip on the same card, so the hovered one reads as
  // singled out instead of the whole cluster staying equally bright.
  const dim = hoveredSlot === null || hoveredSlot === slot ? 1 : 0.35;
  const opacity = useTransform(revealOpacity, (o) => o * dim);

  return (
    <motion.div
      className="pf-mono pf-skill-chip"
      onMouseEnter={() => onHover(slot)}
      onMouseLeave={() => onHover(null)}
      style={{
        position: "absolute",
        top: `${topPercent}%`,
        ...(isLeft ? { left: 0 } : { right: 0 }),
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 11px",
        borderRadius: 8,
        zIndex: 10,
        opacity,
        x,
        scale,
        filter,
        pointerEvents: "auto",
        // Hover recolor is a plain CSS rule (see .pf-skill-chip:hover
        // below), not Framer's whileHover — Framer's color interpolation
        // couldn't reliably read this chip's CSS-custom-property-based
        // rest-state background (var(--team-chip-bg)) as its "from" value,
        // and would occasionally snap one chip to a stray white instead.
        ["--chip-accent" as string]: color,
      }}
      whileHover={{ scale: 1.06 }}
    >
      <Icon size={12} color={color} strokeWidth={2} />
      <span
        style={{
          fontSize: 10.5,
          letterSpacing: "0.05em",
          color: T.text,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </motion.div>
  );
}

function MemberCard({
  member,
  index,
  progress,
}: {
  member: TeamMember;
  index: number;
  progress: MotionValue<number>;
}) {
  const icons = MEMBER_ICONS[member.id] || MANISH_ICONS;
  const skills = member.map;
  const [hoveredSkill, setHoveredSkill] = useState<number | null>(null);

  // PHASE 1: COLLAGE TO SEPARATE (0.0 -> 0.30)
  // Left card pulls right (150px), Right card pulls left (-150px), Center stays 0.
  const fromX = index === 0 ? 150 : index === 2 ? -150 : 0;
  const x = useTransform(progress, [0, 0.30], [fromX, 0]);
  const scale = useTransform(progress, [0, 0.30], [0.93, 1]);

  // Card border fades in as cards separate
  const borderOpacity = useTransform(progress, [0.05, 0.28], [0, 1]);
  const borderColor = useTransform(
    borderOpacity,
    (o) => `rgba(255, 255, 255, ${o * 0.1})`
  );
  const accentOpacity = useTransform(progress, [0, 0.30], [0.2, 0.75]);

  // PHASE 3: BIO EXPANSION (0.70 -> 0.95)
  const bioMaxH = useTransform(progress, [0.70, 0.95], [0, 160]);
  const bioOpacity = useTransform(progress, [0.70, 0.95], [0, 1]);
  const bioPad = useTransform(progress, [0.70, 0.95], [0, 16]);

  return (
    <motion.div
      className="pf-card pf-team-collage-card"
      style={{
        x,
        scale,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor,
        borderRadius: 14,
        background: "var(--team-card-bg)",
        padding: "26px 18px 22px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: index === 1 ? 8 : 4,
        overflow: "hidden",
        height: "100%",
        willChange: "transform",
      }}
    >
      {/* Top accent line */}
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${member.color}, transparent 60%)`,
          opacity: accentOpacity,
        }}
      />

      {/* Name + Role (Always visible). Text here is hardcoded light rather
          than T.text/T.dim — this card sits on --team-card-bg, which stays
          dark/green in both themes rather than flipping to white like a
          normal surface, so its text shouldn't flip to dark either. */}
      <div style={{ marginBottom: 16, padding: "0 4px" }}>
        <div
          className="pf-disp"
          style={{
            fontSize: "clamp(20px, 2.5vw, 26px)",
            fontWeight: 600,
            color: "#f1eee3",
            lineHeight: 1.2,
          }}
        >
          {member.name}
        </div>
        <div
          className="pf-mono"
          style={{
            fontSize: 9.5,
            color: member.color,
            marginTop: 6,
            letterSpacing: "0.06em",
            lineHeight: 1.5,
          }}
        >
          {member.role}
        </div>
      </div>

      {/* Photo + Floating Skills Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 350,
          flexShrink: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {/* Glow behind headshot */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "42%",
            transform: "translate(-50%, -50%)",
            width: 210,
            height: 210,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${member.color}18 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />

        {/* Full portrait (No cropping, Manish slightly zoomed out) */}
        <div
          style={{
            position: "relative",
            width: 330,
            height: "100%",
            zIndex: 1,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/assets/${member.id}.png`}
            alt={member.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center top",
              display: "block",
              filter: "brightness(0.92) contrast(1.06)",
              transform: member.id === "manish" ? "scale(0.85)" : "scale(1)",
              transformOrigin: "center top",
              maskImage:
                "linear-gradient(to bottom, black 60%, transparent 98%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 60%, transparent 98%)",
            }}
          />
        </div>

        {/* Skill chips */}
        {skills.map((label, i) => (
          <SkillChip
            key={`${member.id}-${label}-${i}`}
            label={label}
            Icon={(icons[i] || Zap) as React.ElementType}
            color={member.color}
            isLeft={i % 2 === 0}
            topPercent={8 + Math.floor(i / 2) * 26}
            progress={progress}
            slot={i}
            hoveredSlot={hoveredSkill}
            onHover={setHoveredSkill}
          />
        ))}
      </div>

      {/* Expanding Bio */}
      <motion.div
        style={{
          maxHeight: bioMaxH,
          opacity: bioOpacity,
          marginTop: bioPad,
          paddingTop: bioPad,
          borderTop: "1px solid var(--on-dark-surface-border)",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: `${member.color}18`,
            border: `1px solid ${member.color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill={member.color}
            stroke="none"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div style={{ fontSize: 13, color: "var(--on-dark-surface-dim)", lineHeight: 1.65 }}>
          {member.bio}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Team() {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Scroll Progress locked strictly to when the section enters the screen until it leaves
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.35,
  });

  // Gap expands from 0 (collage) to 24px (separated cards)
  const gap = useTransform(progress, [0, 0.30], [0, 24]);

  return (
    <SectionWrap id="team" style={{ paddingTop: 56 }}>
      {/* Tall outer wrapper gives room to scroll smoothly through the animation */}
      <div ref={sectionRef} style={{ position: "relative", minHeight: "220vh" }}>
        
        {/* Sticky frame holds cards centered on screen during scroll */}
        <div
          style={{
            position: "sticky",
            top: "10vh",
            width: "100%",
          }}
        >
          <Reveal>
            <Eyebrow color={T.amber}>The Team</Eyebrow>
            <h2
              className="pf-disp"
              style={{
                fontSize: "clamp(28px, 4.5vw, 46px)",
                fontWeight: 600,
                maxWidth: 760,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              The people behind the system
            </h2>
            <p
              style={{
                color: T.dim,
                marginTop: 12,
                maxWidth: 620,
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              Scroll down to expand each profile — skills unfold directly from the architecture.
            </p>
          </Reveal>

          <div style={{ height: 28 }} />

          {/* Cards Row */}
          <motion.div
            className="pf-team-row"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "stretch",
              gap,
              width: "100%",
              position: "relative",
            }}
          >
            {TEAM.map((m, i) => (
              <div
                key={m.id}
                className="pf-team-col"
                style={{
                  flex: "1 1 0",
                  minWidth: 0,
                  maxWidth: 420,
                }}
              >
                <MemberCard member={m} index={i} progress={progress} />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <style>{`
        .pf-team-collage-card {
          transition: box-shadow 0.3s ease, background-color 0.32s ease;
        }
        .pf-team-collage-card:hover {
          box-shadow: 0 12px 48px rgba(0,0,0,0.55), 0 0 60px rgba(255,255,255,0.03);
        }

        .pf-skill-chip {
          background: var(--team-chip-bg);
          border: 1px solid ${T.border};
          transition: transform 0.2s ease, background-color 0.25s ease, border-color 0.25s ease, opacity 0.25s ease;
        }
        .pf-skill-chip:hover {
          background-color: color-mix(in srgb, var(--chip-accent) 12%, var(--team-chip-bg));
          border-color: color-mix(in srgb, var(--chip-accent) 45%, transparent);
        }

        @media (max-width: 900px) {
          .pf-team-row {
            flex-direction: column !important;
            gap: 20px !important;
          }
          .pf-team-col {
            max-width: 100% !important;
          }
          .pf-team-collage-card {
            transform: none !important;
          }
        }
      `}</style>
    </SectionWrap>
  );
}