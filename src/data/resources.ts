export type Trimester = "1st" | "2nd" | "3rd";

export type ResourceKind = "article";

export type Resource = {
  id: string;
  title: string;
  subtitle?: string;
  body: string;
  kind: ResourceKind;

  trimester?: Trimester;
  state?: string; // ex: "CA"
};

export const TRIMESTER_FEATURED: Record<Trimester, Resource> = {
  "1st": {
    id: "t1",
    kind: "article",
    trimester: "1st",
    title: "What to expect in your 1st trimester",
    subtitle: "Symptoms, appointments, and what matters most early on",
    body: "1st trimester article...\n\n- Common symptoms\n- Key appointments\n- Red flags to watch\n- Questions to ask at your first visit\n",
  },
  "2nd": {
    id: "t2",
    kind: "article",
    trimester: "2nd",
    title: "What to expect in your 2nd trimester",
    subtitle: "Energy changes, anatomy scan, and preparing ahead",
    body: "2nd trimester article...\n\n- Anatomy scan overview\n- Movement and growth\n- Nutrition & hydration\n- Preparing for birth preferences\n",
  },
  "3rd": {
    id: "t3",
    kind: "article",
    trimester: "3rd",
    title: "What to expect in your 3rd trimester",
    subtitle: "Birth planning, support, and late-pregnancy care",
    body: "3rd trimester article...\n\n- Birth plan essentials\n- Signs of labor\n- Postpartum preparation\n- When to call your provider\n",
  },
};

export const RESOURCES: Resource[] = [
  // Trimester Articles
  {
    id: "r101",
    kind: "article",
    trimester: "1st",
    title: "First trimester appointment checklist",
    subtitle: "What to ask, what to document",
    body:
      "The first trimester is a time of major change. Your early appointments help confirm the pregnancy, establish your due date, review your health history, and identify anything that may need closer monitoring. Coming in prepared can make these visits more useful and less stressful.\n\n" +
      "At your first appointment, your provider may ask about your medical history, past pregnancies, medications, mental health, allergies, and family health conditions. They may also review your lifestyle, nutrition, sleep, and any symptoms you have been experiencing. If needed, lab work or an early ultrasound may be ordered.\n\n" +
      "Bring a list of any medications, vitamins, or supplements you take, including over-the-counter products. If you have questions about what is safe in pregnancy, write them down ahead of time. It is also helpful to bring the date of your last menstrual period, your insurance information, and any records from previous pregnancy care if you have them.\n\n" +
      "Common first-trimester topics to ask about include:\n" +
      "- prenatal vitamins and folic acid\n" +
      "- nausea, fatigue, cramping, or spotting\n" +
      "- foods, drinks, and medications to avoid\n" +
      "- exercise and activity recommendations\n" +
      "- how to manage work, stress, and rest\n" +
      "- what warning signs mean you should call right away\n\n" +
      "You may also want to ask what testing is recommended in the first trimester, when future visits will happen, and how to contact the office between appointments.\n\n" +
      "A simple checklist can help:\n" +
      "- write down your symptoms and questions\n" +
      "- bring your medication and supplement list\n" +
      "- know the first day of your last period if possible\n" +
      "- ask about prenatal vitamins, nutrition, and hydration\n" +
      "- ask what symptoms are normal and what symptoms are urgent\n" +
      "- confirm the next appointment before you leave\n\n" +
      "Your first trimester appointments are not just about tests and paperwork. They are also a chance to ask questions, share concerns, and start building a care plan that supports you throughout pregnancy.",
  },
  {
    id: "r201",
    kind: "article",
    trimester: "2nd",
    title: "Anatomy scan: what you should know",
    subtitle: "How to prepare and advocate",
    body:
      "The second trimester often brings more energy, but it is also a time when important growth and development checks happen. One of the most talked-about visits in this stage is the anatomy scan, which is usually used to look at the baby’s development, check the placenta, review fluid levels, and identify anything that may need follow-up care.\n\n" +
      "Before the appointment, ask what the scan is meant to evaluate and whether there is anything you need to do to prepare. It can also help to ask when and how results will be shared, especially if additional imaging or follow-up is needed. If something is unclear during or after the visit, ask for plain-language explanations and written next steps.\n\n" +
      "The second trimester is also a good time to check in on how your body is changing. You may want to ask about weight changes, sleep, back or pelvic discomfort, swelling, exercise, travel, and emotional health. If you are starting to feel movement, ask what is typical and when to call if movement patterns change later on.\n\n" +
      "Questions to consider asking during this stage include:\n" +
      "- what the anatomy scan can and cannot tell you\n" +
      "- whether the placenta position or cervical length needs follow-up\n" +
      "- how to manage discomfort, stress, or trouble sleeping\n" +
      "- what nutrition and hydration goals are most important now\n" +
      "- what warning signs should lead to a same-day call\n" +
      "- how to prepare for the third trimester and birth planning\n\n" +
      "A helpful second-trimester checklist can include:\n" +
      "- write down anatomy scan questions before the visit\n" +
      "- ask how results will be communicated\n" +
      "- track new symptoms or physical changes\n" +
      "- ask about movement, exercise, and daily activity\n" +
      "- review any work, travel, or support-planning concerns\n" +
      "- confirm what comes next in your care plan\n\n" +
      "This trimester is often a bridge between early pregnancy and birth preparation. It is a good time to stay informed, speak up about concerns, and make sure you understand what your care team is monitoring.",
  },
  {
    id: "r301",
    kind: "article",
    trimester: "3rd",
    title: "Signs of labor and when to go in",
    subtitle: "Know the difference, trust your gut",
    body:
      "The third trimester is the time to prepare for labor, delivery, and the early postpartum period. As your due date gets closer, it is helpful to understand which symptoms are expected, which signs may mean labor is starting, and when it is time to contact your provider or go in.\n\n" +
      "Many people notice more pelvic pressure, trouble sleeping, swelling, shortness of breath with activity, or stronger Braxton Hicks contractions in late pregnancy. These changes can be normal, but it is still important to ask which symptoms are expected for you and which ones should never be ignored.\n\n" +
      "Labor does not always begin the same way for everyone. You may want to ask your provider how to tell the difference between early labor and false labor, what contractions should feel like, when to time them, and what other signs matter, such as leaking fluid, bleeding, decreased movement, or strong persistent pain.\n\n" +
      "Important third-trimester questions include:\n" +
      "- when should I call with contractions\n" +
      "- what if my water breaks\n" +
      "- what amount of bleeding is considered urgent\n" +
      "- when should I worry about decreased fetal movement\n" +
      "- when should I go directly to labor and delivery\n" +
      "- what should I have ready for birth and the first days after\n\n" +
      "A useful third-trimester checklist can include:\n" +
      "- save the labor and delivery phone number in your phone\n" +
      "- ask exactly when your provider wants you to call or come in\n" +
      "- review movement concerns and urgent warning signs\n" +
      "- pack essential hospital or birth-center items\n" +
      "- make a plan for transportation, support people, and child care if needed\n" +
      "- prepare for postpartum recovery, feeding support, and follow-up appointments\n\n" +
      "Even with a plan, labor can unfold in unexpected ways. Knowing the signs ahead of time can help you make decisions faster, feel more prepared, and get support when you need it.",
  },
];
