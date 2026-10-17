import sys
from PIL import Image
out=sys.argv[1]; files=sys.argv[2:]; cols=min(5,len(files)); W=300
ims=[Image.open(f).convert('RGB') for f in files]
h=int(ims[0].height*W/ims[0].width); rows=(len(ims)+cols-1)//cols
M=Image.new('RGB',(cols*(W+4),rows*(h+4)),(0,0,0))
for i,im in enumerate(ims): M.paste(im.resize((W,h)),( (i%cols)*(W+4),(i//cols)*(h+4)))
M.save(out,quality=88)
