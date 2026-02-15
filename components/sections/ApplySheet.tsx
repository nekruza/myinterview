"use client";

import React, { FC, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui";

export interface JobRole {
  title: string;
  type: string;
  skills: string[];
  description: string;
  accent?: string;
  icon?: React.ReactNode;
  fullDescription: {
    about: string;
    responsibilities: string[];
    requirements: string[];
    niceToHave: string[];
  };
}

interface ApplySheetProps {
  role: JobRole | null;
  open: boolean;
  onClose: () => void;
}

export const ApplySheet: FC<ApplySheetProps> = ({ role, open, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    setFileName(null);
    onClose();
  };

  if (!role) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto p-0 bg-white text-neutral-900"
      >
        {submitted ? (
          <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-secondary mb-3">Application Sent!</h3>
            <p className="text-neutral-600 mb-8">
              Thanks for applying for <span className="font-semibold text-secondary">{role.title}</span>.
              We&apos;ll be in touch within 3–5 business days.
            </p>
            <Button onClick={handleClose} variant="outline">Close</Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-secondary px-8 py-8">
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-primary text-xs font-bold uppercase tracking-wider mb-2">
                      Open Position
                    </p>
                    <SheetTitle className="text-white text-2xl font-black">
                      {role.title}
                    </SheetTitle>
                    <SheetDescription className="text-neutral-300 mt-1">
                      {role.type}
                    </SheetDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {role.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </SheetHeader>
            </div>

            <div className="px-8 py-6 space-y-8 bg-white">
              {/* About the role */}
              <div>
                <h4 className="text-base font-bold text-secondary mb-2">About the Role</h4>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  {role.fullDescription.about}
                </p>
              </div>

              <Separator />

              {/* Responsibilities */}
              <div>
                <h4 className="text-base font-bold text-secondary mb-3">What You&apos;ll Do</h4>
                <ul className="space-y-2">
                  {role.fullDescription.responsibilities.map((item, i) => (
                    <li key={i} className="flex items-start text-sm text-neutral-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-3 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Requirements */}
              <div>
                <h4 className="text-base font-bold text-secondary mb-3">Requirements</h4>
                <ul className="space-y-2">
                  {role.fullDescription.requirements.map((item, i) => (
                    <li key={i} className="flex items-start text-sm text-neutral-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 mr-3 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Nice to have */}
              {role.fullDescription.niceToHave.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-base font-bold text-secondary mb-3">Nice to Have</h4>
                    <ul className="space-y-2">
                      {role.fullDescription.niceToHave.map((item, i) => (
                        <li key={i} className="flex items-start text-sm text-neutral-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-2 mr-3 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              <Separator />

              {/* Application form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <h4 className="text-base font-bold text-secondary">Apply for This Role</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="apply-name">Full Name</Label>
                    <Input id="apply-name" placeholder="Jane Smith" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apply-email">Email</Label>
                    <Input id="apply-email" type="email" placeholder="jane@example.com" required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="apply-linkedin">LinkedIn / Portfolio URL</Label>
                  <Input id="apply-linkedin" type="url" placeholder="https://linkedin.com/in/..." />
                </div>

                {/* Resume upload */}
                <div className="space-y-1.5">
                  <Label>Resume</Label>
                  <div
                    className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {fileName ? (
                      <div className="flex items-center justify-center gap-2 text-secondary">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-semibold">{fileName}</span>
                        <span className="text-xs text-neutral-500 ml-1">(click to change)</span>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-8 h-8 text-neutral-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <p className="text-sm text-neutral-500">
                          <span className="font-semibold text-secondary">Click to upload</span> your resume
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">PDF, DOC, DOCX up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="apply-cover">Why do you want to join? <span className="text-neutral-400 font-normal">(optional)</span></Label>
                  <Textarea
                    id="apply-cover"
                    placeholder="Tell us what excites you about this role and MyInterview..."
                    className="resize-none"
                    rows={4}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Submit Application
                </Button>
              </form>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
