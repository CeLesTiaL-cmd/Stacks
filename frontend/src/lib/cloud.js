export function optimizedImage(url, width = 640) {
  if (!url || !String(url).includes("res.cloudinary.com") || !String(url).includes("/image/upload/")) return url;
  if (String(url).includes("/upload/f_auto")) return url;
  return String(url).replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
}
