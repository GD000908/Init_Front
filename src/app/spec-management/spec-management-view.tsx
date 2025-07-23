"use client"

import React, { useState, useEffect, useRef, forwardRef } from "react"
import {
    Briefcase, GraduationCap, Code, FileCheck, Target, Plus, ChevronDown,  Link as LinkIcon, Globe, Award, Folder, Shield, User, Mail, Phone, MapPin, Trash2, Edit2, FileDown, Share2, X, Palette
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"

import * as api from '@/lib/spec-api'
import { useAuth } from '@/hooks/useAuth' // 🔥 useAuth 훅 추가

// --- Helper Hook to load external scripts ---
const useScript = (url: string) => {
    const [status, setStatus] = useState(url ? "loading" : "idle");

    useEffect(() => {
        if (!url) {
            setStatus("idle");
            return;
        }

        let script = document.querySelector(`script[src="${url}"]`) as HTMLScriptElement;

        if (!script) {
            script = document.createElement("script");
            script.src = url;
            script.async = true;
            document.body.appendChild(script);

            const setAttributeFromEvent = (event: Event) => {
                setStatus(event.type === "load" ? "ready" : "error");
            };

            script.addEventListener("load", setAttributeFromEvent);
            script.addEventListener("error", setAttributeFromEvent);
        } else {
            setStatus(script.getAttribute("data-status") || "ready");
        }

        const setStateFromEvent = (event: Event) => {
            const newStatus = event.type === 'load' ? 'ready' : 'error';
            setStatus(newStatus);
            if (script) {
                script.setAttribute("data-status", newStatus);
            }
        };

        script.addEventListener('load', setStateFromEvent);
        script.addEventListener('error', setStateFromEvent);

        return () => {
            if (script) {
                script.removeEventListener('load', setStateFromEvent);
                script.removeEventListener('error', setStateFromEvent);
            }
        };
    }, [url]);

    return status;
};

// --- 🔥 전화번호 포맷팅 유틸리티 함수 ---
const formatPhoneNumber = (value: string): string => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');

    // 11자리를 초과하면 자르기
    const trimmed = numbers.slice(0, 11);

    // 포맷팅 적용 (3-4-4 형식)
    if (trimmed.length <= 3) {
        return trimmed;
    } else if (trimmed.length <= 7) {
        return `${trimmed.slice(0, 3)}-${trimmed.slice(3)}`;
    } else {
        return `${trimmed.slice(0, 3)}-${trimmed.slice(3, 7)}-${trimmed.slice(7)}`;
    }
};

// --- 🔥 포맷팅된 전화번호 입력 컴포넌트 ---
const PhoneInput = ({ value, onChange, ...props }: {
    value: string;
    onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        onChange(formatted);
    };

    return (
        <Input
            {...props}
            value={value}
            onChange={handleChange}
            placeholder="010-0000-0000"
            maxLength={13} // 000-0000-0000 형식의 최대 길이
        />
    );
};


// --- UI Components with Dark Mode Support ---
const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm ${className}`} {...props}>
        {children}
    </div>
)
const Button = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button className={`inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${className}`} {...props} />
)

// 🔥 Input 컴포넌트에 다크 모드 스타일 적용
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        className={`flex h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${props.className}`}
        {...props}
    />
)

// 🔥 Textarea 컴포넌트에 다크 모드 스타일 적용 및 우선순위 조정
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        className={`flex min-h-[120px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-y ${props.className || ''}`}
        {...props}
    />
)

// --- Type Definitions ---
interface ProfileData { name: string; email: string; phone: string; location: string; careerLevel: string; jobTitle: string; introduction: string; }
interface CareerStats { experience: string; workRecords: string; careerGoal: string; }
interface WorkExperience { id: string; company: string; position: string; startDate: string; endDate: string; description: string; }
interface Education { id: string; school: string; major: string; degree: string; startDate: string; endDate: string; }
interface Certificate { id: string; name: string; issuer: string; acquisitionDate: string; }
interface Link { id: string; title: string; url: string; }
interface Language { id: string; language: string; level: string; }
interface Project { id: string; name: string; description: string; startDate: string; endDate: string; }
interface Activity { id: string; name: string; organization: string; startDate: string; endDate: string; }
interface Military { id: string; serviceType: string; militaryBranch: string; startDate: string; endDate: string; }

// --- Sub-components ---

function SkillTag({ skill, onRemove }: { skill: string; onRemove: (skill: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full text-sm font-medium"
        >
            <span>{skill}</span>
            <button onClick={() => onRemove(skill)} className="ml-1 text-indigo-500 hover:text-red-500 dark:text-indigo-400 dark:hover:text-red-400 transition-colors" aria-label={`Remove ${skill} skill`}>
                <X size={14} />
            </button>
        </motion.div>
    );
}

function ProfileCard({ profile, skills, onEditProfile }: { profile: ProfileData, skills: string[], onEditProfile: () => void }) {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
            <Card className="p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full -mr-32 -mt-32 opacity-50"></div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between relative z-10">
                    <div className="flex items-center">
                        <div className="relative">
                            <motion.div className="w-20 h-20 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg" whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                                <div className="absolute inset-0 flex items-center justify-center text-white">
                                    <span className="text-3xl font-semibold">{profile.name.charAt(0)}</span>
                                </div>
                            </motion.div>
                        </div>
                        <div className="ml-5">
                            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{profile.name}</h2>
                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                <span>{profile.careerLevel}</span>
                                <span className="mx-2">|</span>
                                <span>{profile.jobTitle}</span>
                            </div>
                        </div>
                    </div>
                    <Button className="mt-4 md:mt-0 flex items-center gap-1 dark:border-gray-700 dark:text-gray-300 px-4 py-2" onClick={onEditProfile}>
                        <Edit2 className="w-4 h-4" /><span>프로필 수정</span>
                    </Button>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex items-center"><Mail className="w-4 h-4 text-gray-500 mr-2" /><div><p className="text-xs text-gray-500 mb-1">이메일</p><p className="text-sm font-medium dark:text-gray-300">{profile.email}</p></div></div>
                        <div className="flex items-center"><Phone className="w-4 h-4 text-gray-500 mr-2" /><div><p className="text-xs text-gray-500 mb-1">연락처</p><p className="text-sm font-medium dark:text-gray-300">{profile.phone}</p></div></div>
                        <div className="flex items-center"><MapPin className="w-4 h-4 text-gray-500 mr-2" /><div><p className="text-xs text-gray-500 mb-1">거주지</p><p className="text-sm font-medium dark:text-gray-300">{profile.location}</p></div></div>
                        <div className="flex items-center"><Code className="w-4 h-4 text-gray-500 mr-2" /><div><p className="text-xs text-gray-500 mb-1">주요 스택</p><p className="text-sm font-medium dark:text-gray-300 truncate max-w-[200px]">{skills.slice(0, 3).join(", ")}{skills.length > 3 ? ` 외 ${skills.length - 3}개` : ""}</p></div></div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

function IntroductionCard({ introduction, onSave }: { introduction: string; onSave: (newIntroduction: string) => void; }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedIntroduction, setEditedIntroduction] = useState(introduction);
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

    useEffect(() => { setEditedIntroduction(introduction); }, [introduction]);

    const handleSave = () => {
        onSave(editedIntroduction);
        setIsEditing(false);
    };

    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="p-6 overflow-hidden relative">
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center"><User className="w-5 h-5 text-blue-600 mr-2" /><h3 className="text-base font-medium text-gray-800 dark:text-gray-200">나의 간단 소개</h3></div>
                    <Button className="h-8 px-2" onClick={() => setIsEditing(!isEditing)}>{isEditing ? "취소" : <Edit2 className="w-4 h-4" />}</Button>
                </div>
                <div className="relative z-10">
                    <AnimatePresence mode="wait">
                        {isEditing ? (
                            <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                <Textarea value={editedIntroduction} onChange={(e) => setEditedIntroduction(e.target.value)} className="min-h-[100px] w-full resize-y !bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-gray-100" placeholder="자기소개를 입력하세요" />
                                <div className="flex justify-end mt-4 gap-2">
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2" onClick={handleSave}>저장</Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{introduction || "자기소개를 입력해주세요."}</motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>
        </motion.div>
    );
}

function StatCard({ title, value, icon, onSave }: { title: string; value: string; icon: React.ReactNode; onSave: (newValue: string) => void; }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
    useEffect(() => setEditValue(value), [value]);
    const handleSave = () => { onSave(editValue); setIsEditing(false); };
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} whileHover={{ y: -5 }}>
            <Card className="p-4 relative z-10 overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">{icon}</div>
                </div>
                {isEditing ? (
                    <div className="mt-2 flex gap-2">
                        <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }} />
                        <Button className="bg-indigo-500 hover:bg-indigo-600 text-white px-3" onClick={handleSave}>+</Button>
                    </div>
                ) : (<p className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-100 cursor-pointer hover:text-indigo-600" onClick={() => setIsEditing(true)}>{value}</p>)}
            </Card>
        </motion.div>
    );
}

function Section({ title, icon, children, isActive, onClick }: { title: string; icon: React.ReactNode; children?: React.ReactNode; isActive: boolean; onClick: () => void; }) {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
            <Card className={`transition-all duration-300 overflow-hidden ${isActive ? "ring-2 ring-indigo-400" : ""}`}>
                <div className="flex items-center justify-between cursor-pointer p-4" onClick={onClick}>
                    <div className="flex items-center">{icon}<h2 className="ml-3 text-lg font-semibold dark:text-gray-200">{title}</h2></div>
                    <motion.div animate={{ rotate: isActive ? 180 : 0 }}><ChevronDown className="w-5 h-5 text-gray-500" /></motion.div>
                </div>
                <AnimatePresence>{isActive && (<motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden"><div className="p-4 border-t dark:border-gray-800">{children}</div></motion.div>)}</AnimatePresence>
            </Card>
        </motion.div>
    );
}

// 🔥 GenericForm 컴포넌트 - Select와 Textarea에 다크 모드 스타일 적용
const GenericForm = ({ title, onSave, onClose, fields, initialData }: any) => {
    const [data, setData] = useState(initialData.length > 0 ? initialData : [{id: Date.now().toString()}]);
    const updateField = (index: number, fieldName: string, value: any) => { const newData = [...data]; newData[index] = { ...newData[index], [fieldName]: value }; setData(newData); };
    const addItem = () => setData([...data, {id: Date.now().toString()}]);
    const removeItem = (index: number) => { if (data.length > 1) { setData(data.filter((_: any, i: number) => i !== index)); } };
    return (
        <div className="space-y-6">
            {data.map((item: any, index: number) => (
                <div key={item.id} className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4 relative bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title} #{index + 1}</h3>
                    {data.length > 1 && (<Button className="absolute top-2 right-2 text-red-500 hover:text-red-600" onClick={() => removeItem(index)}><Trash2 className="w-4 h-4" /></Button>)}
                    {fields.map((field: any) => (
                        <div key={field.name} className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                            {field.type === 'select' ? (
                                <select
                                    value={item[field.name] || ''}
                                    onChange={(e) => updateField(index, field.name, e.target.value)}
                                    className="flex h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm focus-visible:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="" disabled>{field.placeholder || '선택하세요'}</option>
                                    {field.options.map((option: string) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            ) : field.name === 'description' ? (
                                <Textarea placeholder={field.placeholder} value={item[field.name] || ''} onChange={(e) => updateField(index, field.name, e.target.value)} className="min-h-[100px] w-full resize-y !bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-gray-100" />
                            ) : (
                                <Input type={field.type || 'text'} placeholder={field.placeholder} value={item[field.name] || ''} onChange={(e) => updateField(index, field.name, e.target.value)} />
                            )}
                        </div>
                    ))}
                </div>
            ))}
            <div className="flex justify-center"><Button className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 px-4 py-2" onClick={addItem}><Plus className="w-4 h-4 mr-2" /> {title} 추가</Button></div>
            <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700"><Button className="px-4 py-2" onClick={onClose}>취소</Button><Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2" onClick={() => onSave(data)}>저장</Button></div>
        </div>
    );
};

const SkillsForm = ({ initialSkills, onSave, onClose }: { initialSkills: string[]; onSave: (skills: string[]) => void; onClose: () => void; }) => {
    const [skills, setSkills] = useState(initialSkills);
    const [newSkill, setNewSkill] = useState("");
    const addSkill = () => { if (newSkill.trim() && !skills.includes(newSkill.trim())) { setSkills([...skills, newSkill.trim()]); setNewSkill(""); } };
    const removeSkill = (skillToRemove: string) => { setSkills(skills.filter((skill) => skill !== skillToRemove)); };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } };
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2"><Input type="text" placeholder="새로운 스킬을 입력하세요" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={handleKeyDown} /><Button className="bg-indigo-600 text-white px-4 py-2" onClick={addSkill}>추가</Button></div>
            <div className="flex flex-wrap gap-2 pt-2"><AnimatePresence>{skills.map((skill) => (<SkillTag key={skill} skill={skill} onRemove={removeSkill} />))}</AnimatePresence></div>
            <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700"><Button className="px-4 py-2" onClick={onClose}>취소</Button><Button className="bg-indigo-600 text-white px-4 py-2" onClick={() => onSave(skills)}>저장</Button></div>
        </div>
    );
};

const ProfileEditPanel = ({ isOpen, onClose, profileData, initialSkills, onSave }: { isOpen: boolean; onClose: () => void; profileData: ProfileData; initialSkills: string[]; onSave: (profileData: ProfileData, skillsData: string[]) => void; }) => {
    const [editedProfile, setEditedProfile] = useState(profileData);
    const [editedSkills, setEditedSkills] = useState(initialSkills);
    const [newSkill, setNewSkill] = useState("");
    useEffect(() => { if (isOpen) { setEditedProfile(profileData); setEditedSkills(initialSkills); } }, [isOpen, profileData, initialSkills]);
    const handleChange = (field: keyof ProfileData, value: string) => { setEditedProfile(prev => ({ ...prev, [field]: value })); };
    const addSkill = () => { if (newSkill.trim() && !editedSkills.includes(newSkill.trim())) { setEditedSkills([...editedSkills, newSkill.trim()]); setNewSkill(""); } };
    const removeSkill = (skillToRemove: string) => { setEditedSkills(editedSkills.filter((skill) => skill !== skillToRemove)); };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } };
    const handleSaveClick = () => { onSave(editedProfile, editedSkills); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 ml-0 md:ml-64"><motion.div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-semibold dark:text-gray-100">프로필 수정</h2><Button onClick={onClose}><X className="w-5 h-5" /></Button></div>
            <div className="space-y-6">
                <div><label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">이름</label><Input value={editedProfile.name} onChange={(e) => handleChange('name', e.target.value)} /></div>
                <div><label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">이메일</label><Input type="email" value={editedProfile.email} onChange={(e) => handleChange('email', e.target.value)} /></div>
                <div><label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">연락처</label>
                    <PhoneInput
                        value={editedProfile.phone}
                        onChange={(formattedPhone) => setEditedProfile(prev => ({ ...prev, phone: formattedPhone }))}
                    /></div>
                <div><label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">거주지</label><Input value={editedProfile.location} onChange={(e) => handleChange('location', e.target.value)} /></div>
                <div><label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">경력</label><Input value={editedProfile.careerLevel} onChange={(e) => handleChange('careerLevel', e.target.value)} /></div>
                <div><label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">직무</label><Input value={editedProfile.jobTitle} onChange={(e) => handleChange('jobTitle', e.target.value)} /></div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700"><label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">주요 스택</label><div className="flex items-center gap-2"><Input placeholder="스킬 추가" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={handleKeyDown}/><Button className="bg-indigo-600 text-white whitespace-nowrap px-4 py-2" onClick={addSkill}>추가</Button></div><div className="flex flex-wrap gap-2 mt-3"><AnimatePresence>{editedSkills.map((skill) => (<SkillTag key={skill} skill={skill} onRemove={removeSkill} />))}</AnimatePresence></div></div>
            </div>
            <div className="mt-8 flex justify-end gap-2"><Button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300" onClick={onClose}>취소</Button><Button className="bg-indigo-600 text-white px-4 py-2" onClick={handleSaveClick}>저장</Button></div>
        </motion.div></div>
    );
};

// --- Resume Templates ---
//---------------------------------------------------------------
// 여기서 부터 이력서 pdf 스펙 추출하면 나타내주는 코드 부분임.
//---------------------------------------------------------------
const ClassicTemplate = forwardRef<HTMLDivElement, any>((props, ref) => {
    const { profile, skills, workExperiences, educations, certificates,  projects, activities } = props.data;
    const ResumeSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <section className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 border-b-2 border-blue-600 pb-1 mb-3 uppercase tracking-wide">{title}</h3>
            {children}
        </section>
    );
    const ResumeItem = ({ title, subtitle, date, children }: { title: string; subtitle?: string; date?: string; children?: React.ReactNode }) => (
        <div className="mb-4 pl-4 border-l-2 border-gray-200">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-800">{title}</h4>
                    {subtitle && <p className="text-sm text-gray-600 font-medium">{subtitle}</p>}
                </div>
                {date && <p className="text-xs text-gray-500 ml-4 whitespace-nowrap">{date}</p>}
            </div>
            {children && <div className="mt-2 text-sm text-gray-700 leading-relaxed"><p className="whitespace-pre-wrap">{children}</p></div>}
        </div>
    );
    return (
        <div ref={ref} className="p-8 bg-white text-gray-800 font-sans" style={{ width: '210mm', minHeight: '297mm'}}>
            <header className="mb-8 pb-6 border-b-2 border-gray-300">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                <p className="text-lg text-blue-600 font-medium mb-3">{profile.jobTitle}</p>
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>📧 {profile.email}</div>
                    <div>📱 {profile.phone}</div>
                    <div>📍 {profile.location}</div>
                </div>
            </header>
            <main className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <ResumeSection title="Professional Summary"><p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{profile.introduction}</p></ResumeSection>
                    {workExperiences?.length > 0 && (<ResumeSection title="Work Experience">{workExperiences.map((exp: WorkExperience) => <ResumeItem key={exp.id} title={exp.company} subtitle={exp.position} date={`${exp.startDate} - ${exp.endDate}`}>{exp.description}</ResumeItem>)}</ResumeSection>)}
                    {projects?.length > 0 && (<ResumeSection title="Key Projects">{projects.map((proj: Project) => <ResumeItem key={proj.id} title={proj.name} date={`${proj.startDate} - ${proj.endDate}`}>{proj.description}</ResumeItem>)}</ResumeSection>)}
                </div>
                <div className="space-y-6">
                    {skills?.length > 0 && (<ResumeSection title="Skills"><div className="space-y-2">{skills.map((skill: string, index: number) => <div key={index} className="flex items-center"><div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div><span className="text-sm text-gray-700">{skill}</span></div>)}</div></ResumeSection>)}
                    {educations?.length > 0 && (<ResumeSection title="Education">{educations.map((edu: Education) => <div key={edu.id} className="mb-3"><h4 className="text-sm font-semibold text-gray-800">{edu.school}</h4><p className="text-xs text-gray-600">{edu.major} ({edu.degree})</p><p className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</p></div>)}</ResumeSection>)}
                    {certificates?.length > 0 && (<ResumeSection title="Certifications">{certificates.map((cert: Certificate) => <div key={cert.id} className="mb-3"><h4 className="text-sm font-semibold text-gray-800">{cert.name}</h4><p className="text-xs text-gray-600">{cert.issuer}</p><p className="text-xs text-gray-500">{cert.acquisitionDate}</p></div>)}</ResumeSection>)}
                    {activities?.length > 0 && (<ResumeSection title="Activities">{activities.map((act: Activity) => <div key={act.id} className="mb-3"><h4 className="text-sm font-semibold text-gray-800">{act.name}</h4><p className="text-xs text-gray-600">{act.organization}</p><p className="text-xs text-gray-500">{act.startDate} - {act.endDate}</p></div>)}</ResumeSection>)}
                </div>
            </main>
        </div>
    );
});
ClassicTemplate.displayName = 'ClassicTemplate';

const ModernTemplate = forwardRef<HTMLDivElement, any>((props, ref) => {
    const { profile, skills, workExperiences, educations, certificates, projects } = props.data;
    const ResumeSection = ({ title, children, accent = "blue" }: { title: string; children: React.ReactNode; accent?: string }) => {
        const accentColors: { [key: string]: string } = {
            blue: "border-blue-500 text-blue-600",
            green: "border-green-500 text-green-600",
            purple: "border-purple-500 text-purple-600",
            orange: "border-orange-500 text-orange-600"
        };
        return <section className="mb-6"><h3 className={`text-base font-bold ${accentColors[accent]} border-l-4 pl-3 mb-4`}>{title}</h3>{children}</section>;
    };
    return (
        <div ref={ref} className="bg-white text-gray-800" style={{ width: '210mm', minHeight: '297mm'}}>
            <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
                <h1 className="text-4xl font-bold mb-2">{profile.name}</h1>
                <p className="text-xl opacity-90 mb-4">{profile.jobTitle}</p>
                <div className="flex flex-wrap gap-6 text-sm">
                    <span>✉️ {profile.email}</span><span>📞 {profile.phone}</span><span>📍 {profile.location}</span>
                </div>
            </header>
            <div className="p-8">
                <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 space-y-6">
                        <ResumeSection title="ABOUT ME" accent="blue"><p className="text-sm leading-relaxed whitespace-pre-wrap">{profile.introduction}</p></ResumeSection>
                        {workExperiences?.length > 0 && (<ResumeSection title="EXPERIENCE" accent="green">{workExperiences.map((exp: WorkExperience) => <div key={exp.id} className="mb-4 p-4 bg-gray-50 rounded-lg"><div className="flex justify-between items-start mb-2"><div><h4 className="font-bold text-gray-800">{exp.position}</h4><p className="text-blue-600 font-medium">{exp.company}</p></div><span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{exp.startDate} - {exp.endDate}</span></div><p className="text-sm text-gray-700 whitespace-pre-wrap">{exp.description}</p></div>)}</ResumeSection>)}
                        {projects?.length > 0 && (<ResumeSection title="PROJECTS" accent="purple">{projects.map((proj: Project) => <div key={proj.id} className="mb-4 p-4 bg-purple-50 rounded-lg"><h4 className="font-bold text-gray-800">{proj.name}</h4><p className="text-xs text-purple-600 mb-2">{proj.startDate} - {proj.endDate}</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{proj.description}</p></div>)}</ResumeSection>)}
                    </div>
                    <div className="space-y-6">
                        {skills?.length > 0 && (<ResumeSection title="SKILLS" accent="purple"><div className="flex flex-wrap gap-2">{skills.map((skill: string, index: number) => <div key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">{skill}</div>)}</div></ResumeSection>)}
                        {educations?.length > 0 && (<ResumeSection title="EDUCATION" accent="orange">{educations.map((edu: Education) => <div key={edu.id} className="mb-4 p-3 border-l-4 border-orange-200 bg-orange-50"><h4 className="text-sm font-bold text-gray-800">{edu.school}</h4><p className="text-xs text-gray-600">{edu.major}</p><p className="text-xs text-orange-600 font-medium">{edu.degree}</p></div>)}</ResumeSection>)}
                        {certificates?.length > 0 && (<ResumeSection title="CERTIFICATIONS" accent="green">{certificates.map((cert: Certificate) => <div key={cert.id} className="mb-3 p-3 bg-green-50 rounded"><h4 className="text-sm font-bold text-gray-800">{cert.name}</h4><p className="text-xs text-gray-600">{cert.issuer}</p><p className="text-xs text-green-600">{cert.acquisitionDate}</p></div>)}</ResumeSection>)}
                    </div>
                </div>
            </div>
        </div>
    );
});
ModernTemplate.displayName = 'ModernTemplate';

const MinimalTemplate = forwardRef<HTMLDivElement, any>((props, ref) => {
    const { profile, skills, workExperiences, educations, projects } = props.data;
    return (
        <div ref={ref} className="p-12 bg-white text-gray-900 font-light font-serif" style={{ width: '210mm', minHeight: '297mm'}}>
            <header className="text-center mb-12 pb-8 border-b border-gray-200">
                <h1 className="text-5xl font-thin tracking-widest text-gray-900 mb-3 uppercase">{profile.name}</h1>
                <p className="text-lg text-gray-600 mb-6 tracking-wider">{profile.jobTitle}</p>
                <div className="flex justify-center space-x-8 text-sm text-gray-500">
                    <span>{profile.email}</span><span>•</span><span>{profile.phone}</span><span>•</span><span>{profile.location}</span>
                </div>
            </header>
            <section className="mb-10 text-center"><p className="text-base leading-relaxed text-gray-700 max-w-3xl mx-auto italic">"{profile.introduction}"</p></section>
            {workExperiences?.length > 0 && (<section className="mb-10"><h2 className="text-xl font-light text-center mb-8 tracking-widest uppercase">Experience</h2><div className="space-y-8">{workExperiences.map((exp: WorkExperience) => <div key={exp.id} className="text-center"><h3 className="text-lg font-medium text-gray-900">{exp.position}</h3><p className="text-base text-gray-600 mb-1">{exp.company}</p><p className="text-sm text-gray-500 mb-3">{exp.startDate} - {exp.endDate}</p><p className="text-sm text-gray-700 leading-relaxed max-w-2xl mx-auto whitespace-pre-wrap">{exp.description}</p></div>)}</div></section>)}
            {projects?.length > 0 && (<section className="mb-10"><h2 className="text-xl font-light text-center mb-8 tracking-widest uppercase">Projects</h2><div className="space-y-6">{projects.map((proj: Project) => <div key={proj.id} className="text-center"><h3 className="text-lg font-medium text-gray-900">{proj.name}</h3><p className="text-sm text-gray-500 mb-2">{proj.startDate} - {proj.endDate}</p><p className="text-sm text-gray-700 leading-relaxed max-w-2xl mx-auto whitespace-pre-wrap">{proj.description}</p></div>)}</div></section>)}
            <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-gray-200">
                {skills?.length > 0 && (<div className="text-center"><h3 className="text-lg font-light mb-4 tracking-widest uppercase">Skills</h3><div className="flex flex-wrap justify-center gap-2">{skills.map((skill: string, index: number) => <span key={index} className="text-sm text-gray-600 px-3 py-1 border border-gray-300 rounded-full">{skill}</span>)}</div></div>)}
                {educations?.length > 0 && (<div className="text-center"><h3 className="text-lg font-light mb-4 tracking-widest uppercase">Education</h3>{educations.map((edu: Education) => <div key={edu.id} className="mb-3"><p className="text-base font-medium text-gray-900">{edu.school}</p><p className="text-sm text-gray-600">{edu.major} • {edu.degree}</p></div>)}</div>)}
            </div>
        </div>
    );
});
MinimalTemplate.displayName = 'MinimalTemplate';

const ResumePreview = forwardRef<HTMLDivElement, any>((props, ref) => {
    const { profile, skills, workExperiences, educations, certificates, links, projects, activities } = props.data;
    const ResumeSection = ({ title, children }: { title: string, children: React.ReactNode }) => (<section className="mb-6"><h3 className="text-xl font-bold border-b-2 border-gray-700 pb-2 mb-3 text-gray-800">{title}</h3>{children}</section>);
    const ResumeItem = ({ title, subtitle, date, children }: { title: string, subtitle?: string, date?: string, children?: React.ReactNode }) => (<div className="mb-4"><div className="flex justify-between items-baseline"><h4 className="text-lg font-semibold text-gray-700">{title}</h4>{date && <p className="text-sm text-gray-500">{date}</p>}</div>{subtitle && <p className="text-md text-gray-600 font-medium">{subtitle}</p>}<div className="mt-1 text-sm text-gray-600">{children}</div></div>);
    return (<div ref={ref} className="p-8 bg-white text-gray-800 font-sans" style={{ width: '210mm', minHeight: '297mm'}}><header className="text-center mb-8"><h1 className="text-4xl font-extrabold tracking-tight text-gray-900">{profile.name}</h1><p className="text-xl mt-1 text-gray-600">{profile.jobTitle}</p><div className="flex justify-center gap-6 mt-4 text-sm text-gray-500"><span>{profile.email}</span><span>{profile.phone}</span><span>{profile.location}</span></div></header><main><ResumeSection title="간단 소개"><p className="text-sm leading-relaxed">{profile.introduction}</p></ResumeSection>{skills?.length > 0 && (<ResumeSection title="보유 스킬"><div className="flex flex-wrap gap-2">{skills.map((skill: string) => (<span key={skill} className="bg-gray-200 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>))}</div></ResumeSection>)}{workExperiences?.length > 0 && (<ResumeSection title="업무 경력">{workExperiences.map((exp: WorkExperience) => (<ResumeItem key={exp.id} title={exp.company} subtitle={exp.position} date={`${exp.startDate} - ${exp.endDate}`}><p className="whitespace-pre-wrap">{exp.description}</p></ResumeItem>))}</ResumeSection>)}{educations?.length > 0 && (<ResumeSection title="학력">{educations.map((edu: Education) => (<ResumeItem key={edu.id} title={edu.school} subtitle={`${edu.major} (${edu.degree})`} date={`${edu.startDate} - ${edu.endDate}`} />))}</ResumeSection>)}{projects?.length > 0 && (<ResumeSection title="프로젝트">{projects.map((proj: Project) => (<ResumeItem key={proj.id} title={proj.name} date={`${proj.startDate} - ${proj.endDate}`}><p className="whitespace-pre-wrap">{proj.description}</p></ResumeItem>))}</ResumeSection>)}{certificates?.length > 0 && (<ResumeSection title="자격증">{certificates.map((cert: Certificate) => (<ResumeItem key={cert.id} title={cert.name} subtitle={cert.issuer} date={cert.acquisitionDate} />))}</ResumeSection>)}{activities?.length > 0 && (<ResumeSection title="활동 및 경험">{activities.map((act: Activity) => (<ResumeItem key={act.id} title={act.name} subtitle={act.organization} date={`${act.startDate} - ${act.endDate}`} />))}</ResumeSection>)}{links?.length > 0 && (<ResumeSection title="관련 링크"><ul className="list-disc list-inside">{links.map((link: Link) => (<li key={link.id}><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{link.title}: {link.url}</a></li>))}</ul></ResumeSection>)}</main></div>);
});
ResumePreview.displayName = 'ResumePreview';

const TemplateSelector = ({ isOpen, onClose, currentTemplate, onSelectTemplate }: { isOpen: boolean; onClose: () => void; currentTemplate: string; onSelectTemplate: (template: string) => void }) => {
    const templates = [
        { id: 'default', name: '기본', description: '깔끔하고 전통적인 레이아웃', image: null },
        { id: 'classic', name: '클래식', description: '전문적이고 정돈된 스타일', image: '/classic.png' },
        { id: 'modern', name: '모던', description: '컬러풀하고 현대적인 디자인', image: '/modern.png' },
        { id: 'minimal', name: '미니멀', description: '심플하고 우아한 스타일', image: '/minimal.png' }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 md:translate-x-[140px]">

            <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 max-w-4xl w-full"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold dark:text-gray-100">이력서 템플릿 선택</h2>
                    <Button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                                currentTemplate === template.id
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'border-gray-200 dark:border-gray-700'
                            }`}
                            onClick={() => onSelectTemplate(template.id)}>
                            <div className="h-32 rounded-lg mb-3 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                {template.image ? (
                                    <img
                                        src={template.image}
                                        alt={`${template.name} 템플릿 미리보기`}
                                        className="w-full h-full object-cover object-top"
                                        onError={(e) => {
                                            const target = e.currentTarget as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                                parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm font-medium">${template.name} 미리보기</div>`;
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm font-medium">
                                        {template.name} 미리보기
                                    </div>
                                )}
                            </div>
                            <h3 className="font-semibold text-base mb-1 dark:text-gray-200">{template.name}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{template.description}</p>
                            {currentTemplate === template.id && (
                                <div className="mt-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center">
                                    ✓ 선택됨
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex justify-end">
                    <Button className="bg-indigo-600 text-white px-4 py-2 text-sm" onClick={onClose}>적용</Button>
                </div>
            </motion.div>
        </div>
    );
};
//---------------------------------------------------------------
// 여기서 까지 이력서 pdf 스펙 추출하면 나타내주는 코드 부분임.
//---------------------------------------------------------------




// ==============================================================================
//  Main Page Component
// ==============================================================================
export default function SpecManagementView() {
    // 🔥 모든 Hook을 컴포넌트 최상단에 선언
    const { userId, userName, isLoading: authLoading, isAuthenticated } = useAuth();

    // 초기값을 빈 값으로 변경
    const [profile, setProfile] = useState<ProfileData>({ name: "", email: "", phone: "", location: "", careerLevel: "", jobTitle: "", introduction: "" });
    const [careerStats, setCareerStats] = useState<CareerStats>({ experience: "", workRecords: "", careerGoal: "" });
    const [skills, setSkills] = useState<string[]>([]);
    const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
    const [educations, setEducations] = useState<Education[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [links, setLinks] = useState<Link[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [military, setMilitary] = useState<Military[]>([]);

    // 로딩 및 에러 상태 추가
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('default');
    const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
    const resumeRef = useRef<HTMLDivElement>(null);
    const jsPdfStatus = useScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const html2canvasStatus = useScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    // 데이터 로딩 useEffect 수정 - 실제 사용자 ID 사용
    useEffect(() => {
        const loadUserData = async () => {
            if (!userId) return;

            try {
                setIsLoading(true);
                const userData = await api.fetchUserSpec(parseInt(userId)); // 🔥 실제 사용자 ID 사용

                // 받아온 데이터로 상태 업데이트
                setProfile(userData.profile || { name: "", email: "", phone: "", location: "", careerLevel: "", jobTitle: "", introduction: "" });
                setCareerStats(userData.careerStats || { experience: "", workRecords: "", careerGoal: "" });
                setSkills(userData.skills || []);
                setWorkExperiences(userData.workExperiences || []);
                setEducations(userData.educations || []);
                setCertificates(userData.certificates || []);
                setLinks(userData.links || []);
                setLanguages(userData.languages || []);
                setProjects(userData.projects || []);
                setActivities(userData.activities || []);
                setMilitary(userData.military || []);
            } catch (err) {
                setError('데이터를 불러오는데 실패했습니다.');
                console.error('Failed to load user data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [userId]); // 🔥 userId 의존성 추가

    // handleSave 함수를 async로 변경하고 API 호출 추가
    const handleSave = async (sectionId: string, data: any, secondaryData?: any) => {
        if (!userId) return;

        try {
            let alertMessage = "정보가 성공적으로 저장되었습니다!";
            const currentUserId = parseInt(userId); // 🔥 실제 사용자 ID 사용

            switch (sectionId) {
                case 'profile':
                    await api.updateProfile(currentUserId, data);
                    setProfile(data);
                    if (secondaryData) {
                        await api.updateSkills(currentUserId, secondaryData);
                        setSkills(secondaryData);
                        alertMessage = "프로필과 스킬 정보가 성공적으로 저장되었습니다!";
                    }
                    setIsProfileEditOpen(false);
                    break;
                case 'introduction':
                    const updatedProfile = { ...profile, introduction: data };
                    await api.updateProfile(currentUserId, updatedProfile);
                    setProfile(updatedProfile);
                    break;
                case 'stats_experience':
                    const newStats1 = { ...careerStats, experience: data };
                    await api.updateCareerStats(currentUserId, newStats1);
                    setCareerStats(newStats1);
                    break;
                case 'stats_workRecords':
                    const newStats2 = { ...careerStats, workRecords: data };
                    await api.updateCareerStats(currentUserId, newStats2);
                    setCareerStats(newStats2);
                    break;
                case 'stats_careerGoal':
                    const newStats3 = { ...careerStats, careerGoal: data };
                    await api.updateCareerStats(currentUserId, newStats3);
                    setCareerStats(newStats3);
                    break;
                case 'work':
                    await api.updateWorkExperiences(currentUserId, data);
                    setWorkExperiences(data);
                    setActiveSection(null);
                    break;
                case 'education':
                    await api.updateEducations(currentUserId, data);
                    setEducations(data);
                    setActiveSection(null);
                    break;
                case 'skills':
                    await api.updateSkills(currentUserId, data);
                    setSkills(data);
                    setActiveSection(null);
                    break;
                case 'certificates':
                    await api.updateCertificates(currentUserId, data);
                    setCertificates(data);
                    setActiveSection(null);
                    break;
                case 'links':
                    await api.updateLinks(currentUserId, data);
                    setLinks(data);
                    setActiveSection(null);
                    break;
                case 'languages':
                    await api.updateLanguages(currentUserId, data);
                    setLanguages(data);
                    setActiveSection(null);
                    break;
                case 'projects':
                    await api.updateProjects(currentUserId, data);
                    setProjects(data);
                    setActiveSection(null);
                    break;
                case 'activities':
                    await api.updateActivities(currentUserId, data);
                    setActivities(data);
                    setActiveSection(null);
                    break;
                case 'military':
                    for (const item of data) {
                        // '군필' 또는 '복무중'일 때만 날짜를 필수로 체크합니다.
                        const requiresDates = ['군필', '복무중'].includes(item.serviceType);

                        if (requiresDates && (!item.startDate || !item.endDate)) {
                            alert('병역 구분이 "군필" 또는 "복무중"인 경우, 입대일과 전역일을 모두 입력해야 합니다.');
                            return; // 함수 실행을 중단하여 저장 요청을 보내지 않음
                        }
                    }
                    await api.updateMilitary(currentUserId, data);
                    setMilitary(data);
                    setActiveSection(null);
                    break;
            }
            alert(alertMessage);
        } catch (error) {
            alert('저장에 실패했습니다. 다시 시도해주세요.');
            console.error('Save failed:', error);
        }
    };

    const handleExportToPdf = async () => {
        if (jsPdfStatus !== 'ready' || html2canvasStatus !== 'ready') {
            alert('PDF 라이브러리를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        setIsExportingPdf(true);
        const input = resumeRef.current;
        if (!input) {
            console.error("Resume element not found!");
            setIsExportingPdf(false);
            return;
        }
        try {
            const html2canvas = (window as any).html2canvas;
            const { jsPDF } = (window as any).jspdf;
            const canvas = await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / pdfWidth;
            const imgHeight = canvasHeight / ratio;
            let heightLeft = imgHeight;
            let position = 0;
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
            while (heightLeft > 0) {
                position = position - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            pdf.save(`${profile.name || '이력서'}_${selectedTemplate}_이력서.pdf`);
            alert("PDF가 성공적으로 생성되었습니다.");
        } catch (error) {
            console.error("PDF 생성 중 오류 발생:", error);
            alert("PDF를 생성하는 데 실패했습니다.");
        } finally {
            setIsExportingPdf(false);
        }
    };

    const getSelectedTemplate = () => {
        switch (selectedTemplate) {
            case 'classic': return ClassicTemplate;
            case 'modern': return ModernTemplate;
            case 'minimal': return MinimalTemplate;
            default: return ResumePreview;
        }
    };
    const SelectedResumeTemplate = getSelectedTemplate();

    // 🔥 조건부 렌더링을 Hook들 이후에 처리
    // 인증 로딩 중
    if (authLoading) {
        return (
            <main className="ml-64 md:ml-0 bg-gray-50 dark:bg-gray-950 min-h-screen p-4 sm:p-6 lg:p-8 transition-all duration-300">
                <div className="max-w-none lg:max-w-7xl mx-auto space-y-8 w-full">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">인증 정보를 확인하는 중...</p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // 인증되지 않음
    if (!isAuthenticated || !userId) {
        return (
            <main className="ml-0 md:ml-64 bg-gray-50 dark:bg-gray-950 min-h-screen p-4 sm:p-6 lg:p-8 transition-all duration-300">
                <div className="max-w-none lg:max-w-7xl mx-auto space-y-8 w-full">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-red-600 dark:text-red-400 mb-4">로그인이 필요합니다.</p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // 로딩 상태 처리
    if (isLoading) {
        return (
            <main className="ml-0 md:ml-64 bg-gray-50 dark:bg-gray-950 min-h-screen p-4 sm:p-6 lg:p-8 transition-all duration-300">
                <div className="max-w-none lg:max-w-7xl mx-auto space-y-8 w-full">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">데이터를 불러오는 중...</p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // 에러 상태 처리
    if (error) {
        return (
            <main className="ml-0 md:ml-64 bg-gray-50 dark:bg-gray-950 min-h-screen p-4 sm:p-6 lg:p-8 transition-all duration-300">
                <div className="max-w-none lg:max-w-7xl mx-auto space-y-8 w-full">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                            <Button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-4 py-2">
                                다시 시도
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    const sections = [
        { id: "work", title: "업무 경력", icon: <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />, data: workExperiences, fields: [{name: 'company', label: '회사명'}, {name: 'position', label: '직책'}, {name: 'startDate', label: '시작일', type: 'date'}, {name: 'endDate', label: '종료일', type: 'date'}, {name: 'description', label: '업무 내용'}]},
        {
            id: "education",
            title: "학력",
            icon: <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
            data: educations,
            fields: [
                {name: 'school', label: '학교명', placeholder: '학교 이름을 입력하세요'},
                {name: 'major', label: '전공', placeholder: '전공을 입력하세요'},
                {
                    name: 'degree',
                    label: '학위',
                    type: 'select', // 타입을 'select'로 변경
                    placeholder: '학위를 선택하세요',
                    options: ['해당없음', '전문학사', '학사', '석사', '박사', '전문석사', '전문박사'] // 드롭다운 목록 추가
                },
                {name: 'startDate', label: '입학일', type: 'date'},
                {name: 'endDate', label: '졸업일', type: 'date'}
            ]
        },
        { id: "skills", title: "스킬", icon: <Code className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />, data: skills },
        { id: "certificates", title: "자격증", icon: <FileCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />, data: certificates, fields: [{name: 'name', label: '자격증명'}, {name: 'organization1', label: '발급기관'}, {name: 'acquisitionDate', label: '취득일', type: 'date'}] },
        { id: "projects", title: "프로젝트", icon: <Folder className="w-5 h-5 text-pink-600 dark:text-pink-400" />, data: projects, fields: [{name: 'name', label: '프로젝트명'}, {name: 'description', label: '설명'}, {name: 'startDate', label: '시작일', type: 'date'}, {name: 'endDate', label: '종료일', type: 'date'}] },
        { id: "activities", title: "활동 & 경험", icon: <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />, data: activities, fields: [{name: 'name', label: '활동명'}, {name: 'organization', label: '기관/단체명'}, {name: 'startDate', label: '시작일', type: 'date'}, {name: 'endDate', label: '종료일', type: 'date'}]},
        { id: "links", title: "링크", icon: <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />, data: links, fields: [{name: 'title', label: '링크 제목'}, {name: 'url', label: 'URL'}] },
        { id: "languages", title: "어학", icon: <Globe className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />, data: languages, fields: [{name: 'language', label: '언어'}, {name: 'level', label: '수준'}] },
        {
            id: "military",
            title: "병역",
            icon: <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />,
            data: military,
            fields: [
                {
                    name: 'serviceType',
                    label: '병역 구분',
                    type: 'select',
                    placeholder: '병역 구분을 선택하세요',
                    options: ['해당없음', '군필', '미필', '면제', '복무중']
                },
                {
                    name: 'militaryBranch',
                    label: '군별',
                    type: 'select',
                    placeholder: '군별을 선택하세요',
                    options: ['육군', '해군', '공군', '해병대', '의무경찰', '의무소방', '사회복무요원', '산업기능요원', '기타']
                },
                {name: 'startDate', label: '입대일', type: 'date'},
                {name: 'endDate', label: '전역일', type: 'date'}
            ]
        },
    ];

    const allDataForPdf = { profile, skills, workExperiences, educations, certificates, links, projects, activities };

    return (
        <main className="ml-0 md:ml-64 bg-gray-50 dark:bg-gray-950 min-h-screen p-4 sm:p-6 lg:p-8 transition-all duration-300">
            <div className="max-w-none lg:max-w-7xl mx-auto space-y-8 w-full">
                <div className="flex items-center justify-between">
                    <h1 className="flex items-center text-3xl font-bold text-gray-800 dark:text-gray-100">
                        <span role="img" aria-label="document" className="mr-3">📋</span>
                        스펙 관리
                    </h1>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsTemplateSelectorOpen(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-4 py-2"
                        >
                            <Palette className="w-4 h-4" />
                            템플릿 선택
                        </Button>
                        <Button
                            onClick={() => alert('공유 기능은 현재 개발 중입니다. DB 연결 및 호스팅 후 구현될 예정입니다.')}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2"
                        >
                            <Share2 className="w-4 h-4" />
                            공유 링크 만들기
                        </Button>
                        <Button
                            onClick={handleExportToPdf}
                            disabled={isExportingPdf || jsPdfStatus !== 'ready' || html2canvasStatus !== 'ready'}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 disabled:bg-gray-400 px-4 py-2"
                        >
                            <FileDown className="w-4 h-4" />
                            {isExportingPdf ? '내보내는 중...' : (jsPdfStatus !== 'ready' || html2canvasStatus !== 'ready' ? '준비 중...' : 'PDF로 내보내기')}
                        </Button>
                    </div>
                </div>

                <ProfileCard profile={profile} skills={skills} onEditProfile={() => setIsProfileEditOpen(true)} />
                <IntroductionCard introduction={profile.introduction} onSave={(intro) => handleSave('introduction', intro)} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="총 경력" value={careerStats.experience || "경력 입력"} icon={<Briefcase className="w-5 h-5 text-indigo-600" />} onSave={(val) => handleSave('stats_experience', val)} />
                    <StatCard title="총 업무기록" value={careerStats.workRecords || "업무기록 입력"} icon={<FileCheck className="w-5 h-5 text-purple-600" />} onSave={(val) => handleSave('stats_workRecords', val)} />
                    <StatCard title="내 커리어 목표" value={careerStats.careerGoal || "목표 입력"} icon={<Target className="w-5 h-5 text-emerald-600" />} onSave={(val) => handleSave('stats_careerGoal', val)} />
                </div>

                <div className="space-y-4">
                    {sections.map((section) => (
                        <Section key={section.id} title={section.title} icon={section.icon} isActive={activeSection === section.id} onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}>
                            {section.id === "skills" ? (<SkillsForm initialSkills={skills} onSave={(data) => handleSave("skills", data)} onClose={() => setActiveSection(null)} />)
                                : (<GenericForm title={section.title} onSave={(data: any) => handleSave(section.id, data)} onClose={() => setActiveSection(null)} fields={section.fields} initialData={section.data} />)}
                        </Section>
                    ))}
                </div>

                <ProfileEditPanel isOpen={isProfileEditOpen} onClose={() => setIsProfileEditOpen(false)} profileData={profile} initialSkills={skills} onSave={(profileData, skillsData) => handleSave('profile', profileData, skillsData)} />
                <TemplateSelector isOpen={isTemplateSelectorOpen} onClose={() => setIsTemplateSelectorOpen(false)} currentTemplate={selectedTemplate} onSelectTemplate={setSelectedTemplate} />
            </div>

            {/* PDF 생성을 위한 숨겨진 컴포넌트 */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <SelectedResumeTemplate ref={resumeRef} data={allDataForPdf} />
            </div>
        </main>
    );
}