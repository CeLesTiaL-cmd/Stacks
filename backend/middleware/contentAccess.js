// uploader can be an ObjectId (plain query) OR a populated user document
// (GET /api/content/:slug populates it) — always compare by id.
function uploaderIdOf(content) {
  return String(content.uploader?._id ?? content.uploader);
}

export function canViewContent(content, user, emailVerified = false) {
  if (!content) return false;

  const isOwner = Boolean(user) && uploaderIdOf(content) === String(user._id);
  const isStaff = Boolean(user) && ["admin", "moderator"].includes(user.role);

  // Not yet approved (pending / rejected): only the owner and staff may see it.
  if (content.status !== "approved") return isOwner || isStaff;

  if (content.visibility === "public") return true;
  if (!user) return false;
  if (isOwner || isStaff) return true;

  if (
    content.visibility === "institutional" &&
    user.isInstitutionalVerified &&
    user.institutionDomain === content.institutionDomain
  ) {
    return true;
  }

  return (
    content.visibility === "protected" &&
    emailVerified &&
    (content.authorizedEmails || []).includes(user.email)
  );
}