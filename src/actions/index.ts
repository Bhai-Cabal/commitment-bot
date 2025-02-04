import { Context } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";
import axios from "axios";
import {
  getMindfulnessRanking,
  getRanking,
  getShippingRanking,
  updateGroupMindfulnessCount,
  updateUserCount,
} from "../firebase/queries";
import {
  analyzeGymPhoto,
  analyzeMindfulnessPhoto,
  analyzeShippingPhoto,
} from "../openai";
import { extractMentions, getCurrentDate } from "../utils";
import { firestore } from "firebase-admin";
import { acquireLock, releaseLock } from "../firebase";

export const handlePhotoSent = async (
  ctx: Context,
  db: firestore.Firestore,
) => {
  const msg = ctx.message as Message.PhotoMessage;

  // Check if the caption contains "/pumped", "/pump", "/shipped", or "/zenned"
  if (
    !msg.caption ||
    !/\/pumped|\/pump|\/shipped|\/zenned/i.test(msg.caption)
  ) {
    // If not a valid command, ignore this photo
    return;
  }

  const isShipping = /\/shipped/i.test(msg.caption);
  const isMindfulness = /\/zenned/i.test(msg.caption);

  if (ctx.chat?.type === "private") {
    await ctx.reply(
      `Namaste ${isMindfulness ? "mindful one" : isShipping ? "builder" : "warrior"}! 🙏 Add me to your Bhai group to share your ${isMindfulness ? "spiritual" : isShipping ? "building" : "strength"} journey with the community.`,
      { reply_parameters: { message_id: msg.message_id } },
    );
    return;
  }

  const username =
    ctx.from?.first_name ||
    ctx.from?.username ||
    (isMindfulness ? "Mindful One" : isShipping ? "Builder" : "Warrior");
  try {
    const userId = ctx.from?.id.toString();
    const groupId = ctx.chat?.id.toString();

    if (!userId || !groupId) {
      await ctx.reply(
        `A moment of patience, ${username}. Our systems seek alignment. Your dedication is noted. 🙏`,
        { reply_parameters: { message_id: msg.message_id } },
      );
      return;
    }

    const lockRef = db.collection("locks").doc(`${groupId}_${userId}`);
    const acquired = await acquireLock(lockRef, 10000, db);

    if (!acquired) {
      await ctx.reply(
        `Patience, ${username}. Your previous ${isMindfulness ? "practice" : isShipping ? "contribution" : "training"} is being recorded. Honor the process. 🙏`,
        { reply_parameters: { message_id: msg.message_id } },
      );
      return;
    }

    try {
      const currentDate = getCurrentDate();
      const userRef = db
        .collection("groups")
        .doc(groupId)
        .collection("users")
        .doc(userId);

      const userDoc = await userRef.get();
      const userData = userDoc.data() || {};
      const dailyData = userData.dailyData || {};
      const todayData = dailyData[currentDate] || {
        gymPhotoUploaded: false,
        shippingPhotoUploaded: false,
        mindfulnessPhotoUploaded: false,
        attempts: 0,
      };

      if (
        (isMindfulness && todayData.mindfulnessPhotoUploaded) ||
        (isShipping && todayData.shippingPhotoUploaded) ||
        (!isShipping && !isMindfulness && todayData.gymPhotoUploaded)
      ) {
        await ctx.reply(
          `${username}, your dedication is noted! Today's ${isMindfulness ? "practice" : isShipping ? "contribution" : "training"} is recorded. Prepare for tomorrow's growth. 🙏`,
          { reply_parameters: { message_id: msg.message_id } },
        );
        return;
      }

      if (todayData.attempts >= 5) {
        await ctx.reply(
          `${username}, your enthusiasm honors us. Take this moment to reflect and return stronger tomorrow. 🙏`,
          { reply_parameters: { message_id: msg.message_id } },
        );
        return;
      }

      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const response = await axios.get(fileLink.href, {
        responseType: "arraybuffer",
      });
      const photoBuffer = Buffer.from(response.data, "binary");

      let isValidPhoto: boolean;
      let feedback: string;

      if (isMindfulness) {
        [isValidPhoto, feedback] = await analyzeMindfulnessPhoto(
          photoBuffer,
          username,
        );
      } else if (isShipping) {
        [isValidPhoto, feedback] = await analyzeShippingPhoto(
          photoBuffer,
          username,
        );
      } else {
        [isValidPhoto, feedback] = await analyzeGymPhoto(photoBuffer, username);
      }

      if (isValidPhoto) {
        await updateUserCount(ctx, currentDate, isShipping, isMindfulness, db);

        if (isMindfulness) {
          const mentionedUsers = extractMentions(msg.caption);
          if (mentionedUsers.length > 0) {
            await updateGroupMindfulnessCount(
              groupId,
              mentionedUsers,
              db,
              currentDate,
            );
            feedback += `\n\nUnity strengthens us! 🙏 ${mentionedUsers.join(", ")} ${mentionedUsers.length > 1 ? "join" : "joins"} your mindful path.`;
          }
        }
      } else {
        await userRef.set(
          {
            dailyData: {
              ...dailyData,
              [currentDate]: {
                ...todayData,
                attempts: todayData.attempts + 1,
              },
            },
          },
          { merge: true },
        );
      }

      await ctx.reply(feedback, {
        reply_parameters: { message_id: msg.message_id },
      });
    } finally {
      await releaseLock(lockRef);
    }
  } catch (error) {
    console.error(
      `Error processing ${isMindfulness ? "mindfulness" : isShipping ? "building" : "training"} activity:`,
      error,
    );
    await ctx.reply(
      `${username}, a moment of technical reflection is needed. Your commitment is valued. 🙏`,
      { reply_parameters: { message_id: msg.message_id } },
    );
  }
};

export const handleGetRanking = async (ctx: any, db: firestore.Firestore) => {
  if (ctx.chat.type === "private") {
    ctx.reply(
      "Namaste warrior! Join us in a Bhai group to witness our collective strength journey. 🙏",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
    return;
  }

  try {
    const groupId = ctx.chat.id.toString();
    const ranking = await getRanking(groupId, db);
    ctx.reply(ranking);
  } catch (error) {
    console.error("Error getting strength ranking:", error);
    ctx.reply(
      "A moment of patience, Bhais. Our strength metrics seek alignment. 🙏",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  }
};

export const handleGetShippingRanking = async (
  ctx: any,
  db: firestore.Firestore,
) => {
  if (ctx.chat.type === "private") {
    ctx.reply(
      "Namaste builder! Join us in a Bhai group to celebrate our collective progress. 🙏",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
    return;
  }

  try {
    const groupId = ctx.chat.id.toString();
    const ranking = await getShippingRanking(groupId, db);
    ctx.reply(ranking);
  } catch (error) {
    console.error("Error getting shipping ranking:", error);
    ctx.reply(
      "A moment of patience, Bhais. Our building metrics seek alignment. 🙏",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  }
};

export const handleGetMindfulnessRanking = async (
  ctx: any,
  db: firestore.Firestore,
) => {
  if (ctx.chat.type === "private") {
    ctx.reply(
      "Namaste mindful one! Join us in a Bhai group to share our spiritual journey. 🙏",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
    return;
  }

  try {
    const groupId = ctx.chat.id.toString();
    const ranking = await getMindfulnessRanking(groupId, db);
    ctx.reply(ranking);
  } catch (error) {
    console.error("Error getting mindfulness ranking:", error);
    ctx.reply(
      "A moment of patience, Bhais. Our spiritual metrics seek alignment. 🙏",
      { reply_parameters: { message_id: ctx.message.message_id } },
    );
  }
};

export async function handleBeZen(ctx: Context, db: firestore.Firestore) {
  const userId = ctx.from?.id.toString();
  const username = ctx.from?.username || ctx.from?.first_name || "Mindful One";
  const groupId = ctx.chat?.id.toString();

  if (!userId || !groupId) {
    await ctx.reply("A moment of patience. Our systems seek alignment. 🙏");
    return;
  }

  if (ctx?.chat?.type === "private") {
    await ctx.reply(
      "Namaste seeker! Join us in a Bhai group to begin our mindful journey together. 🙏",
    );
    return;
  }

  const userRef = db
    .collection("groups")
    .doc(groupId)
    .collection("users")
    .doc(userId);

  try {
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        username,
        mindfulnessCount: 0,
        fitnessCount: 0,
        shippingCount: 0,
      });
      await ctx.reply(
        `Welcome to the path, ${username}! Share your mindful moments with /zenned. 🙏✨`,
      );
    } else {
      await ctx.reply(
        `${username}, your spiritual journey continues. Share your practice with /zenned. 🙏`,
      );
    }
  } catch (error) {
    console.error("Error in handleBeZen:", error);
    await ctx.reply(
      "A moment of technical alignment needed. Please try again. 🙏",
    );
  }
}
