### 矩阵转移DP
昨天考了PZK的duliu题目。第二道原创题目出的很好。先把题面放上来：

题目描述
由于 f o t 机房里黑暗势力猖獗，善良的小 G 遭到了非人的折磨。 现在，小 G 被扔到了一个地牢里，从时刻 0 开始，要从起点 S 走向终点 T ——那是唯一通向外界的地方。黑暗势力为了进出地牢，会在 k 时刻开放终点，也仅会在 k 时刻开放终点。这并不意味着终点的房间在k时刻以前不能经过，只是不能通向外界而已。 地牢有 n 个房间，对于给定 m 对 ( u , v) 的房间之间有一扇门，门当然是可以从任意一边进入，任意一边出来。每扇门需要一定力量来推开，即只有力量大于等于这个值，才能通过这扇门。当然，通过一扇门需要 1 时刻的时间，也即从第 x 时刻到第 x + 1 时刻，小G能通过一扇门。 当然，毁灭世界的恶势力不会如此轻易的放过他，于是，他们用高超的 O I 技术编写了几个巡逻机器人，放置在迷宫里。由于小 G 长年待在黑暗势力内部，早已脆弱不堪，一旦小 G 和机器人相遇，他就 G G 了。而且，传承自 f o t 优秀的时空折叠技术，机器人会瞬移，而不受门的影响。你可以理解为它们不会经过任意一扇门，所以小 G 不会在从一个房间至另一个房间的路途中 G G 。 这可怎么办呢？由于小 G 深谙敌军的组成和习性，知道某人总是造锅，导致了人工智能智障化——它们仅仅会周期性的游走。小G已经掌握了源码中的错误，知晓了每个机器人的游走房间顺序，和周期 T 。它们会在第 1 时刻出现并开始按照顺序遍历，所以小 G 在第 0 时刻不会受到影响，小 G 不会开场 G G 。 那么问题来了，由于小 G 忙于逃跑，他想询问，需要多大的力气才能逃出地牢。 当然，由于从第 0 时刻到第 1 时刻只有 1.001 s ，他要用 0.001 s 的时间锻炼身体来获取最低的力量值，所以，你只有 1 s 的时间来回答这个问题。如果无论如何都不能逃出去，请输出 “ i m p o s s i b l e ” 。 请注意：任意时刻小G必须经过一扇门，如果某一时刻小G无路可走，也请输出"impossible"

输入格式
输入第一行，三个非负整数 n , m , k ，表示房间的个数和门的数量以及终点恰好开放的时间 接下来 m 行，每行有三个非负整数 u , v , w ，分别表示门的两边与推开此门的最小力量值 第 m + 2 行有一个非负整数 n u m ，表示机器人的数量，和两个正整数 S , T ，表示起点与终点 接下来 n u m 行，每行第一个正整数为 t i ，表示第 i 个机器人的周期，后面会有 t i 个正整数，表示机器人依次遍历的房间 
输出格式
输出一个数，表示你最小需要的力量值 
样例
样例输入 1 :
```
4 5 3
1 2 3
2 4 6
3 2 4
1 4 5
2 3 4
2 1 3
2 2 1
3 2 1 4
```
样例输出 1 :
```
6
```
对于前 10 %的数据， m = 0 对于另外 20 %的数据，对于任意 i ，都有 t i = 1 对于另外 20 %的数据，推开所有门的力量值一样 对于前 60 %的数据， n ≤ 15 , m ≤ 100 , k ≤ 10 4 对于全部的数据， n ≤ 50 , m ≤ 1600 , k ≤ 10 8 , n u m ≤ 10 , t i ≤ 4 ，并且，推开每扇门的力量值 ≤ 10 6
#### 关于这到题目：
首先想到的是二分一个最大长度（类似几乎所有的noip图论题），然后考虑如何判定。几乎所有的人都知道怎么用矩阵计算。但是我不会。于是我搜到了一道题：

[迷路](https://www.luogu.org/problem/P4159)

第一篇题解写的很好：我们把暴力转移的DP方程列出来，发现这就类似与一个矩阵的形式。矩阵满足交换律，所以可以使用ksm，不经加速，还可以省去时间那一个维度。更直观的理解：转移的过程相当与将两张图“复合”起来，而矩阵乘法就是在模拟一个二元关系复合的过程。

在这道题目中，还会碰到一个坎：有机器人的打扰。我们可以找出循环节（循环节很小）,直接枚举时间，将不合法的情况置0即可。然后用ksm。

~~我调不出来~~

看看代码：
```cpp
#include<bits/stdc++.h>
using namespace std;
template<typename T>inline T read(){
	T x=0,f=0;char c=getchar();
	while(!isdigit(c)) f=c=='-',c=getchar();
	while(isdigit(c)) x=x*10+c-48,c=getchar();
	return f?-x:x;
}
#define int long long
namespace run{
	#define mid ((l+r)>>1)
	const int inf=1e9;
	const int N=53;
	const int cyc=12;
	int n,m,K,S,T,num,mx,mn=inf;
	struct node{
		int u,v,w;
		explicit node(){}
		node(int _u,int _v,int _w):u(_u),v(_v),w(_w){}
		bool operator <(const node &A)const{return w<A.w;}
	}e[N*N];
	struct robot{int t,num[5];robot(){}}rob[N];
	struct Matrix{
		int a[N][N];
		explicit Matrix(){memset(a,0,sizeof(a));}
		inline void reset(){memset(a,0,sizeof(a));}
		inline void init(){for(int i=1;i<=n;a[i][i]=1,i++);}
		int* operator [](int B){return a[B];}
		const int* operator [](int B)const{return a[B];}
		Matrix operator *(const Matrix &A)const{
			Matrix C;
			for(int i=1;i<=n;i++)
				for(int k=1;k<=n;k++)
					for(int j=1;j<=n;j++)
						C[i][j]|=a[i][k]&&A[k][j];
			return C;
		}
	}tmp[13];
	Matrix qpow(Matrix A,int y){
		Matrix ret;ret.init();
		while(y){
			if(y&1) ret=ret*A;
			A=A*A;y>>=1;
		}
		return ret;
	}
	int main(){
		n=read<int>(),m=read<int>(),K=read<int>();
		for(int i=1;i<=m;i++){
			int u(read<int>()),v(read<int>()),w(read<int>());
			mx=max(mx,w),mn=min(mn,w),e[i]=node(u,v,w);
		}
		sort(e+1,e+m+1);
		num=read<int>(),S=read<int>(),T=read<int>();
		for(int i=1;i<=num;i++){
			rob[i].t=read<int>();
			for(int j=1;j<=rob[i].t;j++) rob[i].num[j]=read<int>();
		}
		if(m==0) puts((K==0 && S==T)?"0":"impossible"),exit(0);

		int l=mn,r=mx,ret=-1;
		while(l<=r){
			Matrix adj;adj.init();
			for(int i=1;i<=cyc;i++) tmp[i].reset();
			for(int i=1;i<=m;i++)
				if(e[i].w<=mid)
					for(int j=1;j<=cyc;j++)
						tmp[j][e[i].u][e[i].v]=tmp[j][e[i].v][e[i].u]=1;
				else break;
			for(int i=1;i<=num;i++)
				for(int k=1;k<=rob[i].t;k++){
					int tot=k;
					while(tot<=cyc){
						for(int j=1;j<=n;j++) 
							tmp[tot][j][rob[i].num[k]]=0;
						tot+=rob[i].t;
					}
				}
			int tims=K/cyc;
			for(int i=1;i<=cyc;adj=adj*tmp[i],i++);
			adj=qpow(adj,tims);
			for(int i=1;i<=K%cyc;i++) adj=adj*tmp[i];
			if(adj[S][T]) ret=mid,r=mid-1;
			else l=mid+1;
		}
		if(~ret) printf("%lld\n",ret);
		else puts("impossible");
		return 0;
	}
}
#undef int
int main(){
	freopen("simulation.in","r",stdin);
	freopen("simulation.out","w",stdout);
	return run::main();
}
```
此题沿袭了以往noip的出题风格，分数段多，解法多样（类似于保卫王国，也可以用倍增，甚至可以骗到100分）。是一道不错的练习题（笑）。

