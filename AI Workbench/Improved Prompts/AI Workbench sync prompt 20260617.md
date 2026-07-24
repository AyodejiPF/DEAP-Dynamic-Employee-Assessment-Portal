# Improved Prompt

Ayodeji wants you to inspect the AI Workbench folder on the Windows Desktop and report exactly what you find. Treat this as a careful configuration and safety review, not a casual folder listing.

Start by locating the Desktop folder named AI Workbench. Confirm whether it exists. If it does not exist, say so clearly and stop without guessing. If it exists, list the main folders and files inside it, including the settings area, the skills area, and any reference documents. Then inspect the folder structure deeply enough to identify every shared setting file and every skill folder that contains a skill instruction file.

Read the shared settings file inside the Global Settings folder before doing any other configuration work. Summarise the active preferences you find there in plain language. Compare those preferences with the assistant instructions already active in the current environment. Identify any conflicts, overlaps, or missing pieces. A conflict means two instructions cannot both be followed at the same time. An overlap means they say roughly the same thing. A missing piece means the shared hub contains guidance that the current assistant environment has not yet adopted.

Next, inspect the Skills folder inside AI Workbench. For each skill found, read its skill instruction file and identify the skill name, what it is for, when it should be triggered, and whether it already exists in the assistant environment. Do not assume that a skill is installed just because it exists in the hub. Check the current assistant skills directory or available skill registry where possible.

Do not delete anything. Do not overwrite anything. Do not rename anything. Do not move anything. Do not replace an existing assistant skills folder with a linked folder if that would hide or disturb existing skills. If a direct folder link would create risk, say so and use a safer additive approach.

If there is no conflict, sync only the missing information in the safest practical way. For skills, this may mean copying a missing skill into the assistant skills directory as a new folder, while leaving all existing skills untouched. For global settings, this may mean confirming that the shared hub convention is already present, or adding a reference only if it is missing and safe to do so. If you make any change, verify it afterwards using a file listing and a file hash or equivalent check.

If there is any conflict, stop before changing that specific item and report the conflict clearly. Explain what the conflict is, why it matters, what the safer option is, and what decision is needed from Ayodeji. Continue with any other safe work that is not affected by the conflict.

Your final response must include four sections.

1. What I found

Describe the AI Workbench folder contents in simple terms, including the number of settings files, reference files, and skills found.

2. What I synced

State exactly what was synced, if anything. If nothing was synced, explain why.

3. Conflicts and risks

List any conflicts, risks, or important limitations. Include whether the current assistant can fully honour the shared hub in this same session or only in future sessions.

4. Practical next steps

Give Ayodeji a clear action plan for keeping AI Workbench as the shared source of truth across Codex and other AI coding tools.

Use British English. Address the user as Ayodeji. Be direct, practical, and careful. Prefer concise explanations, but include enough detail for Ayodeji to understand what was found, what changed, what did not change, and why.
