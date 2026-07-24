/**
 * Circular user avatar. Renders the uploaded photo when present, otherwise a
 * green circle with the user's initials. Size is configurable (px).
 */
export default function Avatar({ user, size = 36 }) {
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.display_name || "User"}
        className="avatar avatar--img"
        style={style}
      />
    );
  }

  return (
    <span className="avatar avatar--initials" style={style}>
      {user?.initials || "?"}
    </span>
  );
}
