# FlowAble — 5-Minute Hackathon Demo Script

**Project:** FlowAble  
**Hackathon:** Stop Prompting, Solo Agents Hackathon  
**Track:** Track 4: Accessibility & Adaptive Assistants  
**Integrations:** Omi (Voice Webhook) + Qdrant Cloud (Persistent Memory) + Lyzr Agent Studio (Reasoning)

---

## Overview

This 5-minute demo script demonstrates the real, working end-to-end execution loop of FlowAble. Use this script for your video submission, live judging, or demo booth.

---

## Scene 1: Problem & Vision (0:00 – 0:45)

**Visual:** FlowAble Dashboard (`http://localhost:8000`). Show the high-contrast toggle and font size controls.

**Spoken Script:**
> "Hi everyone, I'm presenting **FlowAble**, built solo for **Track 4: Accessibility & Adaptive Assistants**.
>
> For millions of people with cognitive disabilities, memory impairments, ADHD, or sensory overload, keeping track of rapid spoken instructions—like a doctor's medical advice, a supervisor's work instructions, or daily family reminders—is exhausting. Traditional chat assistants require you to remember what you heard, type it out, and prompt again.
>
> FlowAble solves this by pairing the **Omi wearable** for continuous hands-free voice capture, **Qdrant Cloud** for persistent semantic memory, and **Lyzr Agent Studio** for accessible, grounded task assistance. Let's see the real system in action."

---

## Scene 2: Hands-Free Voice Capture via Omi (0:45 – 1:45)

**Visual:** Navigate to the **Memory** tab. Click **Simulate / Add Memory** and switch to **Simulate Omi Webhook Payload** (or trigger a real webhook via Omi wearable/ngrok).

**Spoken Script:**
> "Imagine our user just spoke with their doctor or wearable companion. Omi compiles the transcript segments and delivers an HTTP `POST` webhook to our backend at `/omi/conversation`.
>
> Watch as this conversation is sent:
> *'Doctor: Remember to take your heart medication with breakfast at 8:00 AM. Drink a full glass of water, and pick up your refill on Friday before 5:00 PM.'*
>
> The FastAPI backend validates the payload, extracts speaker segments and action items, and immediately generates a 384-dimensional embedding vector using FastEmbed."

---

## Scene 3: Persistent Vector Memory in Qdrant (1:45 – 2:45)

**Visual:** Point to the newly indexed memory in the **Memory** tab and show the **Qdrant Cloud** cluster badge (`flowable-memory`).

**Spoken Script:**
> "Notice the memory is now stored inside our dedicated Qdrant Cloud cluster, **flowable-memory**, in the collection `flowable_memory`.
>
> To protect users against duplicate webhook deliveries, FlowAble uses a deterministic UUIDv5 idempotency key based on conversation ID and text.
>
> Let's perform a semantic search in the Memory search bar for *'pills in the morning'*. Even though the word 'pills' was never spoken, Qdrant's cosine similarity instantly surfaces the medication instructions with high similarity."

---

## Scene 4: Grounded Agent Reasoning with Lyzr Studio (2:45 – 4:00)

**Visual:** Navigate to **Ask FlowAble**. Type the question:
> *"What did the doctor tell me about my medicine and what do I need to do?"*
Click **Ask FlowAble**.

**Spoken Script:**
> "Now, our user asks FlowAble a question. 
> 
> Here is what happens behind the scenes:
> 1. FlowAble embeds the user's question.
> 2. It queries Qdrant to retrieve only the relevant factual conversation snippets.
> 3. It sends the question and retrieved context to the **Lyzr Agent Studio** v3 Chat inference API.
> 4. Lyzr generates an answer strictly grounded in the retrieved memories.
>
> Notice the response:
> - It is written in simple, supportive language with short paragraphs.
> - It does NOT invent facts or hallucinate false appointments.
> - Most importantly for cognitive accessibility, it generates an **Interactive Action Checklist**! Users can check off each step right here in the UI as they finish taking their medication or getting their refill."

---

## Scene 5: Accessibility Features & Live Activity Log (4:00 – 5:00)

**Visual:** 
1. Click the **Read Aloud** button (browser speech synthesis speaks the answer).
2. Toggle **High Contrast** mode and change font size to **Large**.
3. Click the **Activity** tab to display the real execution timeline.

**Spoken Script:**
> "FlowAble is designed for accessibility from the ground up:
> - Click **Read Aloud**, and the browser reads the answer smoothly for visually impaired or dyslexic users.
> - The **Adaptive Mode** toolbar allows instant one-click switching to High Contrast and larger font sizes.
> - In the **Activity** tab, judges can observe the real-time execution loop: webhook received, memory vector persisted, semantic retrieval completed, and Lyzr reasoning executed. Notice that our logs maintain complete user privacy—no secret keys or private conversation transcripts are leaked.
>
> This is FlowAble: an accessible, adaptive assistant that empowers people to navigate their daily lives with confidence. Thank you!"
