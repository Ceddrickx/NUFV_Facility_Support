/* Validation. Messages are specific and helpful, not generic. */
(function () {
  const App = (window.App = window.App || {});
  const V = {};

  // Steps: 1 Location, 2 Category, 3 Details, 4 Attachments (at least one clear photo; one short video is optional), 5 Review.
  const isImage = (a) =>
    !!a && a.kind === 'photo' && typeof a.mime === 'string' && a.mime.toLowerCase().startsWith('image/');
  const isVideo = (a) =>
    !!a && a.kind === 'video' && typeof a.mime === 'string' && a.mime.toLowerCase().startsWith('video/');
  V.ticketStep = function (f, step) {
    const e = {};
    if (step >= 1 && !f.locationId) e.location = 'Please select a location so we can send the right technician.';
    if (step >= 2 && !(f.category && App.C.catByName(f.category)))
      e.category = 'Please choose the kind of problem so we can route your report.';
    if (step >= 3) {
      const d = (f.description || '').trim();
      if (d.length < 10 || d.length > 100) e.description = 'Please describe the problem in 10 to 100 characters.';
    }
    if (step >= 4) {
      const atts = Array.isArray(f.attachments) ? f.attachments : [];
      if (atts.some((a) => !isImage(a) && !isVideo(a))) e.photos = 'Only photos (JPG, PNG or WEBP) and one short video can be attached.';
      else if (!atts.some(isImage)) e.photos = 'A photo is required. Please attach at least one clear photo of the issue before continuing.';
    }
    return e;
  };
  V.ticketForm = (f) => V.ticketStep(f, 4);

  V.scheduleForm = function (f) {
    const e = {};
    if (!f.ticketId) e.ticketId = 'Please choose a ticket.';
    if (!f.date) e.date = 'Please choose a date.';
    if (!f.start) e.start = 'Please choose a start time.';
    if (!f.end) e.end = 'Please choose an end time.';
    if (f.date && f.start && f.end) {
      if (App.fmt.at(f.date, f.start) <= App.clock.now()) e.start = 'The date and start time must be in the future.';
      if (f.end <= f.start) e.end = 'End time must be after the start time.';
    }
    return e;
  };

  const IMG = ['image/jpeg', 'image/png', 'image/webp'];
  // Reporter flow is images only (enforced by ticketStep above). The video branch is kept ONLY for staff
  // "repair video" uploads in ticketActions.js, which are not part of the report wizard.
  const VID = ['video/mp4', 'video/webm', 'video/quicktime'];
  V.file = function (file, kind, existing) {
    if (kind === 'photo') {
      if (!IMG.includes(file.type)) return `"${file.name}" is not a supported image. Use JPG, PNG or WEBP.`;
      if (file.size > 5 * 1048576)
        return `"${file.name}" is ${App.fmt.size(file.size)}. Images must be 5 MB or smaller.`;
      if ((existing || 0) >= 5) return 'You can add at most 5 images.';
    } else {
      if (!VID.includes(file.type) && !/\.(mp4|webm|mov)$/i.test(file.name))
        return `"${file.name}" is not a supported video. Use MP4, WebM or MOV.`;
      if (file.size > 25 * 1048576)
        return `"${file.name}" is ${App.fmt.size(file.size)}. Videos must be 25 MB or smaller.`;
      if ((existing || 0) >= 1) return 'You can add only one short video.';
    }
    return '';
  };

  App.validators = V;
})();
