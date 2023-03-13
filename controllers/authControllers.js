const DUMMY_USERS = [
  {
    id: "bsf1900334",
    name: "Jamshaid Javaid",
    password: "hellotesters",
    role: ["Admin", "Student", "Supervisor"],
  },
  {
    name: "Dolan Kim",
    id: "WRD47ZVC1VS",
    password: "QSM81IDA2QV",
    role: ["Student"],
  },
  {
    name: "Carl O'connor",
    id: "UDE02DOH9MT",
    password: "JRO16SGE5HQ",
    role: ["Teacher"],
  },
  {
    name: "Matthew Mckee",
    id: "NDV68CHU7NF",
    password: "NHV12VVO8XV",
    role: ["Student"],
  },
  {
    name: "Ray Boone",
    id: "EBV41KIU5ZY",
    password: "NEX33GVN8VS",
    role: ["Teacher"],
  },
  {
    name: "Sarah Stephenson",
    id: "HJN42XQU6DK",
    password: "JWN53VHJ8SW",
    role: ["Student"],
  },
];

const login = (req, res, next) => {
  const { id, loginAs, password } = req.body;

  const identifiedUser = DUMMY_USERS.find(
    (u) => u.id === id && u.password === password && u.role.includes(loginAs)
  );
  if (!identifiedUser) {
    return res.status(401).json({ message: "Unidentified User" });
  }

  res.status(200).json({ message: `Logged In as ${loginAs}` });
};

module.exports = {
  login,
};
